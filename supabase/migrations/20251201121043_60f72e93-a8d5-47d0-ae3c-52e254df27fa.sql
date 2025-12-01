-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('STAFF', 'PARTNER');

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  company_name TEXT,
  phone TEXT,
  role app_role NOT NULL DEFAULT 'PARTNER',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table to manage roles (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Create order_status enum
CREATE TYPE public.order_status AS ENUM ('requested', 'accepted', 'confirmed', 'completed', 'settled', 'cancelled');

-- Create orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  partner_id UUID REFERENCES public.profiles(id) NOT NULL,
  staff_id UUID REFERENCES public.profiles(id) NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  service_type TEXT NOT NULL,
  service_date TIMESTAMPTZ NOT NULL,
  service_location TEXT NOT NULL,
  amount DECIMAL(10, 2),
  status order_status NOT NULL DEFAULT 'requested',
  notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create order_files table for attachments
CREATE TABLE public.order_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  uploaded_by UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create settlements table
CREATE TABLE public.settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL UNIQUE,
  partner_id UUID REFERENCES public.profiles(id) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  confirmed_by UUID REFERENCES public.profiles(id),
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create messages table for communication
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) NOT NULL,
  receiver_id UUID REFERENCES public.profiles(id),
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'PARTNER')
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'PARTNER')
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Staff can view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'STAFF'));

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Staff can view all roles" ON public.user_roles
  FOR SELECT USING (public.has_role(auth.uid(), 'STAFF'));

-- RLS Policies for orders
CREATE POLICY "Partners can view their own orders" ON public.orders
  FOR SELECT USING (auth.uid() = partner_id);

CREATE POLICY "Staff can view all orders" ON public.orders
  FOR SELECT USING (public.has_role(auth.uid(), 'STAFF'));

CREATE POLICY "Staff can insert orders" ON public.orders
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'STAFF'));

CREATE POLICY "Staff can update all orders" ON public.orders
  FOR UPDATE USING (public.has_role(auth.uid(), 'STAFF'));

CREATE POLICY "Partners can update their own orders" ON public.orders
  FOR UPDATE USING (auth.uid() = partner_id);

-- RLS Policies for order_files
CREATE POLICY "Users can view files for their orders" ON public.order_files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_files.order_id
      AND (orders.partner_id = auth.uid() OR public.has_role(auth.uid(), 'STAFF'))
    )
  );

CREATE POLICY "Users can upload files for their orders" ON public.order_files
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_files.order_id
      AND (orders.partner_id = auth.uid() OR public.has_role(auth.uid(), 'STAFF'))
    )
  );

-- RLS Policies for settlements
CREATE POLICY "Partners can view their own settlements" ON public.settlements
  FOR SELECT USING (auth.uid() = partner_id);

CREATE POLICY "Staff can view all settlements" ON public.settlements
  FOR SELECT USING (public.has_role(auth.uid(), 'STAFF'));

CREATE POLICY "Staff can manage settlements" ON public.settlements
  FOR ALL USING (public.has_role(auth.uid(), 'STAFF'));

-- RLS Policies for messages
CREATE POLICY "Users can view their messages" ON public.messages
  FOR SELECT USING (
    auth.uid() = sender_id OR 
    auth.uid() = receiver_id OR
    public.has_role(auth.uid(), 'STAFF')
  );

CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their received messages" ON public.messages
  FOR UPDATE USING (auth.uid() = receiver_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Create indexes for better performance
CREATE INDEX idx_orders_partner_id ON public.orders(partner_id);
CREATE INDEX idx_orders_staff_id ON public.orders(staff_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_service_date ON public.orders(service_date);
CREATE INDEX idx_messages_order_id ON public.messages(order_id);
CREATE INDEX idx_messages_sender_receiver ON public.messages(sender_id, receiver_id);