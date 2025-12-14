const Index = () => {
  // This page redirects to dashboard via router
  // Keeping as fallback
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-16 h-16 rounded-xl gradient-hero flex items-center justify-center mx-auto mb-4">
          <span className="text-cream font-bold text-2xl">M8</span>
        </div>
        <h1 className="mb-2 text-3xl font-bold text-foreground">Media 8</h1>
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    </div>
  );
};

export default Index;
