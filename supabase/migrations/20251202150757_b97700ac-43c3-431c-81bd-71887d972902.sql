-- pricing_rule_groups 테이블에 컬럼 추가
ALTER TABLE public.pricing_rule_groups 
ADD COLUMN profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
ADD COLUMN season_type TEXT DEFAULT 'regular'; -- 'peak', 'off_peak', 'regular'

-- pricing_rules 테이블에 컬럼 추가
ALTER TABLE public.pricing_rules
ADD COLUMN months INTEGER[] DEFAULT ARRAY[1,2,3,4,5,6,7,8,9,10,11,12],
ADD COLUMN weekdays INTEGER[] DEFAULT ARRAY[0,1,2,3,4,5,6], -- 0=일요일, 6=토요일
ADD COLUMN start_time TIME,
ADD COLUMN end_time TIME,
ADD COLUMN min_guests INTEGER DEFAULT 1,
ADD COLUMN max_guests INTEGER;

-- 인덱스 추가
CREATE INDEX idx_pricing_rule_groups_profile_id ON public.pricing_rule_groups(profile_id);
CREATE INDEX idx_pricing_rules_group_id ON public.pricing_rules(group_id);