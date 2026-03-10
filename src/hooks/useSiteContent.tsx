import { useState, useEffect, createContext, useContext } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface GalleryImage {
  url: string;
  alt: string;
}

export interface SectionLayout {
  textAlign: 'left' | 'center' | 'right';
  imagePosition: 'left' | 'right' | 'top' | 'bottom' | 'background';
  columns: 2 | 3 | 4;
  padding: 'sm' | 'md' | 'lg';
  bgColor: 'white' | 'dark' | 'accent';
}

export interface CustomSection {
  id: string;
  type: 'text_block' | 'image_block' | 'banner' | 'cta';
  title: string;
  text: string;
  image: string;
  buttonText: string;
  buttonLink: string;
  layout: SectionLayout;
}

export const DEFAULT_LAYOUT: SectionLayout = {
  textAlign: 'left',
  imagePosition: 'right',
  columns: 3,
  padding: 'md',
  bgColor: 'white',
};

export interface SiteContent {
  // Hero
  hero_title: string;
  hero_subtitle: string;
  hero_image: string;
  // Menu
  menu_title: string;
  menu_subtitle: string;
  // About
  about_title: string;
  about_text: string;
  about_image: string;
  // Footer / Contact
  footer_phone: string;
  footer_email: string;
  footer_address: string;
  // Gallery
  gallery_title: string;
  gallery_text: string;
  gallery_images: GalleryImage[];
  // Reservation
  reservation_title: string;
  reservation_text: string;
  // Catering
  catering_title: string;
  catering_text: string;
  // Social Media
  social_instagram: string;
  social_tiktok: string;
  social_facebook: string;
  social_linkedin: string;
  // Page Builder (home)
  sections_order: string[];
  sections_visibility: Record<string, boolean>;
  sections_layout: Record<string, Partial<SectionLayout>>;
  custom_sections: CustomSection[];
  // Per-page custom blocks & ordering
  page_sections: Record<string, {
    order: string[];
    visibility: Record<string, boolean>;
    custom_blocks: CustomSection[];
  }>;
}

export const BUILTIN_SECTIONS = ['hero', 'menu', 'catering', 'gallery', 'about', 'reservation', 'footer'] as const;

const DEFAULT_CONTENT: SiteContent = {
  hero_title: "Willkommen bei\nPiratino!",
  hero_subtitle: "Pizza, Pasta und mehr seit 2006 – das Original",
  hero_image: "",
  menu_title: "Menu",
  menu_subtitle: "Im Restaurant geniessen, selbst abholen oder nach Hause bestellen",
  about_title: "Über uns",
  about_text: "Am besten, Sie lernen uns persönlich kennen und überzeugen sich vom Geschmack unserer Speisen! Unsere Pizzeria besteht bereits seit 2006. Seit dem bieten wir unseren Gästen leckere Pizzen sowie weitere italienische Gerichte und Highlights aus der Schweizer Küche an. Überzeugen Sie sich selbst:",
  about_image: "",
  footer_phone: "044 431 32 33",
  footer_email: "piratinoag@hotmail.com",
  footer_address: "Badenerstrasse 696, 8048 Zürich",
  gallery_title: "Galerie",
  gallery_text: "In unserer Galerie bekommen Sie einen Eindruck von unseren Speisen und Getränken sowie vom Ambiente des Restaurants. Wir freuen uns auf Ihren baldigen Besuch!",
  gallery_images: [],
  reservation_title: "Tisch reservieren",
  reservation_text: "Reservieren Sie Ihren Tisch bei Piratino – wir freuen uns auf Ihren Besuch!",
  catering_title: "Catering buchen",
  catering_text: "6 perfekt abgestimmte Catering-Pakete – individuell erweiterbar",
  social_instagram: "@pizzapiratino",
  social_tiktok: "@pizzapiratino",
  social_facebook: "Facebook",
  social_linkedin: "LinkedIn",
  sections_order: [...BUILTIN_SECTIONS],
  sections_visibility: {},
  sections_layout: {},
  custom_sections: [],
};

interface SiteContentContextType {
  content: SiteContent;
  loading: boolean;
}

const SiteContentContext = createContext<SiteContentContextType>({
  content: DEFAULT_CONTENT,
  loading: true,
});

export const SiteContentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [content, setContent] = useState<SiteContent>(DEFAULT_CONTENT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const { data, error } = await supabase
          .from("site_settings")
          .select("*")
          .eq("key", "content")
          .single();
        if (!error && data) {
          setContent({ ...DEFAULT_CONTENT, ...(data.value as Record<string, any>) });
        }
      } catch {
        // Use defaults
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, []);

  return (
    <SiteContentContext.Provider value={{ content, loading }}>
      {children}
    </SiteContentContext.Provider>
  );
};

export const useSiteContent = () => useContext(SiteContentContext);

export { DEFAULT_CONTENT };
