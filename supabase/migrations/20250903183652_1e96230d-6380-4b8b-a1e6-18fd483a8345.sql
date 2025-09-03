-- Create category mappings table for text normalization
CREATE TABLE IF NOT EXISTS public.category_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  text_input TEXT NOT NULL,
  category_id UUID NOT NULL,
  subcategory_id UUID,
  confidence_score NUMERIC(3,2) DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, text_input)
);

-- Enable RLS
ALTER TABLE public.category_mappings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "category_mappings_select_own" 
ON public.category_mappings 
FOR SELECT 
USING (auth.uid() = user_id AND user_id IS NOT NULL);

CREATE POLICY "category_mappings_insert_own" 
ON public.category_mappings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

CREATE POLICY "category_mappings_update_own" 
ON public.category_mappings 
FOR UPDATE 
USING (auth.uid() = user_id AND user_id IS NOT NULL);

CREATE POLICY "category_mappings_delete_own" 
ON public.category_mappings 
FOR DELETE 
USING (auth.uid() = user_id AND user_id IS NOT NULL);

-- Add update timestamp trigger
CREATE TRIGGER update_category_mappings_updated_at
BEFORE UPDATE ON public.category_mappings
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for performance
CREATE INDEX idx_category_mappings_user_id ON public.category_mappings(user_id);
CREATE INDEX idx_category_mappings_text_input ON public.category_mappings(text_input);

-- Add foreign key constraints
ALTER TABLE public.category_mappings
ADD CONSTRAINT fk_category_mappings_category
FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;

ALTER TABLE public.category_mappings
ADD CONSTRAINT fk_category_mappings_subcategory
FOREIGN KEY (subcategory_id) REFERENCES public.categories(id) ON DELETE CASCADE;