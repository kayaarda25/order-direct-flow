-- Create admin_users table to identify admin users
CREATE TABLE public.admin_users (
    id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create menu_items table
CREATE TABLE public.menu_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category TEXT NOT NULL,
    image_url TEXT,
    allergens TEXT[] DEFAULT '{}',
    available BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.admin_users
        WHERE id = auth.uid()
    )
$$;

-- Create RLS policies for admin_users table
CREATE POLICY "Admins can view admin users"
    ON public.admin_users
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

CREATE POLICY "Admins can insert admin users"
    ON public.admin_users
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update admin users"
    ON public.admin_users
    FOR UPDATE
    TO authenticated
    USING (public.is_admin());

CREATE POLICY "Admins can delete admin users"
    ON public.admin_users
    FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- Create RLS policies for menu_items table
CREATE POLICY "Anyone can view menu items"
    ON public.menu_items
    FOR SELECT
    TO authenticated, anon
    USING (true);

CREATE POLICY "Admins can insert menu items"
    ON public.menu_items
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update menu items"
    ON public.menu_items
    FOR UPDATE
    TO authenticated
    USING (public.is_admin());

CREATE POLICY "Admins can delete menu items"
    ON public.menu_items
    FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_menu_items_updated_at
    BEFORE UPDATE ON public.menu_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for menu images
INSERT INTO storage.buckets (id, name, public) VALUES ('menu-images', 'menu-images', true);

-- Create storage policies for menu images
CREATE POLICY "Anyone can view menu images"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'menu-images');

CREATE POLICY "Admins can upload menu images"
    ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'menu-images' AND public.is_admin());

CREATE POLICY "Admins can update menu images"
    ON storage.objects
    FOR UPDATE
    USING (bucket_id = 'menu-images' AND public.is_admin());

CREATE POLICY "Admins can delete menu images"
    ON storage.objects
    FOR DELETE
    USING (bucket_id = 'menu-images' AND public.is_admin());