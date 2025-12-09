-- Create bug_reports table
CREATE TABLE public.bug_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  error_path TEXT NOT NULL,
  error_description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bug_report_comments table for responses
CREATE TABLE public.bug_report_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID NOT NULL REFERENCES public.bug_reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bug_report_comments ENABLE ROW LEVEL SECURITY;

-- RLS policies for bug_reports
CREATE POLICY "Partners can view their own bug reports"
ON public.bug_reports
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Partners can create bug reports"
ON public.bug_reports
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Staff can view all bug reports"
ON public.bug_reports
FOR SELECT
USING (has_role(auth.uid(), 'STAFF'::app_role));

CREATE POLICY "Staff can update bug reports"
ON public.bug_reports
FOR UPDATE
USING (has_role(auth.uid(), 'STAFF'::app_role));

-- RLS policies for bug_report_comments
CREATE POLICY "Users can view comments on their reports"
ON public.bug_report_comments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.bug_reports
    WHERE bug_reports.id = bug_report_comments.report_id
    AND (bug_reports.user_id = auth.uid() OR has_role(auth.uid(), 'STAFF'::app_role))
  )
);

CREATE POLICY "Staff can create comments"
ON public.bug_report_comments
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'STAFF'::app_role));

CREATE POLICY "Partners can create comments on their reports"
ON public.bug_report_comments
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.bug_reports
    WHERE bug_reports.id = bug_report_comments.report_id
    AND bug_reports.user_id = auth.uid()
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_bug_reports_updated_at
BEFORE UPDATE ON public.bug_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();