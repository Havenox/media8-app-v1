import { BrandLogo } from "@/components/BrandLogo";

const Index = () => {
  // This page redirects to dashboard via router
  // Keeping as fallback
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <BrandLogo variant="cream" size="sm"/>
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    </div>
  );
};

export default Index;
