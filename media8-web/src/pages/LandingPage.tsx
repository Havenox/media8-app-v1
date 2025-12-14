import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Play,
  Sparkles,
  Zap,
  Palette,
  Music,
  ChevronRight,
  Check,
  Star,
  ArrowRight,
  MessageCircle,
  Mail,
  ExternalLink,
  ChevronUp,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  avulsoProducts,
  assinaturaProducts,
  pacoteProducts,
  youtubeProducts,
  faqItems,
  testimonials,
  contactInfo,
  Product,
} from '@/data/products';

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

// Header Component
const LandingHeader: React.FC = () => {
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg gradient-hero flex items-center justify-center">
            <span className="text-cream font-bold text-lg">M8</span>
          </div>
          <span className="font-bold text-xl text-foreground">Media 8</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <button
            onClick={() => scrollToSection('portfolio')}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Portfólio
          </button>
          <button
            onClick={() => scrollToSection('pricing')}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Planos
          </button>
          <button
            onClick={() => scrollToSection('about')}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Sobre
          </button>
        </nav>

        {/* CTA */}
        <Link to="/dashboard">
          <Button variant="outline" size="sm">
            Área do Cliente
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </header>
  );
};

// Hero Section
const HeroSection: React.FC = () => {
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-primary">
      {/* Subtle overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/20" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 pt-24 pb-16 text-center">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="max-w-4xl mx-auto"
        >
          {/* Headline */}
          <motion.h1
            variants={fadeInUp}
            className="text-4xl md:text-6xl lg:text-7xl font-bold text-cream leading-tight mb-6"
          >
            Transforme vídeos comuns em{' '}
            <span className="bg-gradient-to-r from-cream via-cream-dark to-cream bg-clip-text text-transparent">
              Autoridade Digital
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={fadeInUp}
            className="text-xl md:text-2xl text-cream/80 mb-8 max-w-2xl mx-auto"
          >
            Edição estratégica para experts e mentores que jogam o jogo do alto valor.
            <span className="block mt-2 text-lg italic text-cream/60">
              Edição que posiciona, conecta e vende.
            </span>
          </motion.p>

          {/* CTAs */}
          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="xl"
              className="bg-cream text-primary hover:bg-cream/90 shadow-xl"
              onClick={() => scrollToSection('pricing')}
            >
              <Play className="h-5 w-5 mr-2" />
              Ver Planos e Valores
            </Button>
            <Button
              size="xl"
              variant="outline"
              className="border-cream/30 text-cream hover:bg-cream/10"
              onClick={() => scrollToSection('portfolio')}
            >
              Ver Portfólio
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            variants={fadeInUp}
            className="mt-12 flex flex-wrap justify-center gap-8 text-cream/60 text-sm"
          >
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-success" />
              +500 vídeos editados
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-success" />
              Clientes em 3 países
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-success" />
              Entrega em até 7 dias
            </div>
          </motion.div>
        </motion.div>
      </div>

    </section>
  );
};

// Method Section
const MethodSection: React.FC = () => {
  const methods = [
    {
      icon: Zap,
      title: 'Ritmo',
      description: 'Cortes que mantêm sua audiência presa do início ao fim.',
    },
    {
      icon: Music,
      title: 'Emoção',
      description: 'Trilha sonora que dita o sentimento e amplifica a mensagem.',
    },
    {
      icon: Palette,
      title: 'Identidade',
      description: 'Elementos visuais que gritam a sua marca em cada frame.',
    },
  ];

  return (
    <section id="about" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="text-center mb-16"
        >
          <motion.span
            variants={fadeInUp}
            className="text-primary font-medium text-sm uppercase tracking-wider"
          >
            Nossa Metodologia
          </motion.span>
          <motion.h2
            variants={fadeInUp}
            className="text-3xl md:text-5xl font-bold text-foreground mt-4 mb-6"
          >
            Não é só corte. É estratégia.
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Cada vídeo é pensado para causar impacto sem tirar a essência de quem está na câmera.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="grid md:grid-cols-3 gap-8"
        >
          {methods.map((method) => (
            <motion.div key={method.title} variants={fadeInUp}>
              <Card variant="elevated" className="text-center h-full hover:border-primary/20 transition-colors">
                <CardHeader>
                  <div className="w-16 h-16 rounded-2xl gradient-hero flex items-center justify-center mx-auto mb-4">
                    <method.icon className="h-8 w-8 text-cream" />
                  </div>
                  <CardTitle className="text-xl">{method.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{method.description}</CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Quote */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <blockquote className="text-2xl md:text-3xl text-primary/80 italic max-w-3xl mx-auto">
            "Cada vídeo que trabalho é pensado para causar impacto, sem tirar a essência de quem está
            na frente da câmera."
          </blockquote>
          <p className="mt-4 text-muted-foreground">— Equipe Media 8</p>
        </motion.div>
      </div>
    </section>
  );
};

// Portfolio Section
const PortfolioSection: React.FC = () => {
  return (
    <section id="portfolio" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="text-center mb-16"
        >
          <motion.span
            variants={fadeInUp}
            className="text-primary font-medium text-sm uppercase tracking-wider"
          >
            Portfólio
          </motion.span>
          <motion.h2
            variants={fadeInUp}
            className="text-3xl md:text-5xl font-bold text-foreground mt-4 mb-6"
          >
            Não é mágica. É técnica.
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Edições dinâmicas que retêm a atenção até o último segundo. Veja a transformação.
          </motion.p>
        </motion.div>

        {/* Before/After Grid */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <motion.div key={item} variants={fadeInUp}>
              <Card className="overflow-hidden group cursor-pointer hover:shadow-xl transition-all">
                <div className="aspect-[9/16] bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-primary/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="h-16 w-16 text-cream" />
                  </div>
                  <div className="text-center p-6">
                    <Play className="h-12 w-12 text-primary/40 mx-auto mb-4" />
                    <p className="text-muted-foreground">Projeto {item}</p>
                    <Badge variant="outline" className="mt-2">Antes x Depois</Badge>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <a href={contactInfo.whatsappLink} target="_blank" rel="noopener noreferrer">
            <Button variant="premium" size="lg">
              <MessageCircle className="h-5 w-5 mr-2" />
              Quero um vídeo assim
            </Button>
          </a>
        </motion.div>
      </div>
    </section>
  );
};

// Product Card Component
const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const isHighlight = product.highlight;

  return (
    <Card
      variant={isHighlight ? 'elevated' : 'default'}
      className={`relative h-full transition-all hover:shadow-lg ${
        isHighlight ? 'border-primary ring-2 ring-primary/20' : ''
      }`}
    >
      {product.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground shadow-lg">
            <Star className="h-3 w-3 mr-1" />
            {product.badge}
          </Badge>
        </div>
      )}

      <CardHeader className="text-center pb-4">
        <CardTitle className="text-xl">{product.title}</CardTitle>
        <CardDescription>{product.description}</CardDescription>
        {product.duration && (
          <Badge variant="secondary" className="mt-2 w-fit mx-auto">
            {product.duration}
          </Badge>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Price */}
        <div className="text-center">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-sm text-muted-foreground">R$</span>
            <span className="text-4xl font-bold text-foreground">{product.price}</span>
          </div>
          {product.pricePerUnit && (
            <p className="text-sm text-primary font-medium mt-1">{product.pricePerUnit}</p>
          )}
        </div>

        {/* Features */}
        <ul className="space-y-3">
          {product.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3 text-sm">
              <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
              <span className="text-muted-foreground">{feature}</span>
            </li>
          ))}
        </ul>

        {/* Note */}
        {product.note && (
          <p className="text-xs text-muted-foreground text-center bg-muted/50 rounded-lg p-3">
            {product.note}
          </p>
        )}

        {/* CTA */}
        <a href={contactInfo.whatsappLink} target="_blank" rel="noopener noreferrer" className="block">
          <Button
            variant={isHighlight ? 'premium' : 'outline'}
            className="w-full"
          >
            Contratar Agora
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </a>
      </CardContent>
    </Card>
  );
};

// Pricing Section
const PricingSection: React.FC = () => {
  return (
    <section id="pricing" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="text-center mb-16"
        >
          <motion.span
            variants={fadeInUp}
            className="text-primary font-medium text-sm uppercase tracking-wider"
          >
            Investimento
          </motion.span>
          <motion.h2
            variants={fadeInUp}
            className="text-3xl md:text-5xl font-bold text-foreground mt-4 mb-6"
          >
            Escolha seu plano ideal
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Opções flexíveis para cada estágio da sua jornada de conteúdo.
          </motion.p>
        </motion.div>

        <Tabs defaultValue="assinatura" className="w-full">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-4 mb-12">
            <TabsTrigger value="avulso">Avulsos</TabsTrigger>
            <TabsTrigger value="assinatura">Assinaturas</TabsTrigger>
            <TabsTrigger value="pacote">Pacotes</TabsTrigger>
            <TabsTrigger value="youtube">YouTube</TabsTrigger>
          </TabsList>

          <TabsContent value="avulso">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="grid md:grid-cols-3 gap-8"
            >
              {avulsoProducts.map((product) => (
                <motion.div key={product.id} variants={fadeInUp}>
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
          </TabsContent>

          <TabsContent value="assinatura">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="grid md:grid-cols-3 gap-8"
            >
              {assinaturaProducts.map((product) => (
                <motion.div key={product.id} variants={fadeInUp}>
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
          </TabsContent>

          <TabsContent value="pacote">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="grid md:grid-cols-3 gap-8"
            >
              {pacoteProducts.map((product) => (
                <motion.div key={product.id} variants={fadeInUp}>
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
          </TabsContent>

          <TabsContent value="youtube">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="grid md:grid-cols-3 gap-8"
            >
              {youtubeProducts.map((product) => (
                <motion.div key={product.id} variants={fadeInUp}>
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

// Testimonials Section
const TestimonialsSection: React.FC = () => {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="text-center mb-16"
        >
          <motion.span
            variants={fadeInUp}
            className="text-primary font-medium text-sm uppercase tracking-wider"
          >
            Depoimentos
          </motion.span>
          <motion.h2
            variants={fadeInUp}
            className="text-3xl md:text-5xl font-bold text-foreground mt-4 mb-6"
          >
            O que dizem nossos clientes
          </motion.h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="grid md:grid-cols-3 gap-8"
        >
          {testimonials.map((testimonial, index) => (
            <motion.div key={index} variants={fadeInUp}>
              <Card variant="elevated" className="h-full">
                <CardContent className="pt-6">
                  <div className="flex gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="h-5 w-5 fill-warning text-warning" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-6 italic">"{testimonial.content}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-semibold">
                        {testimonial.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

// FAQ Section
const FAQSection: React.FC = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="text-center mb-16"
        >
          <motion.span
            variants={fadeInUp}
            className="text-primary font-medium text-sm uppercase tracking-wider"
          >
            Dúvidas Frequentes
          </motion.span>
          <motion.h2
            variants={fadeInUp}
            className="text-3xl md:text-5xl font-bold text-foreground mt-4 mb-6"
          >
            Perguntas e Respostas
          </motion.h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">{item.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};

// CTA Section
const CTASection: React.FC = () => {
  return (
    <section className="py-24 gradient-hero">
      <div className="container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-5xl font-bold text-cream mb-6">
            Pronto para transformar seu conteúdo?
          </h2>
          <p className="text-xl text-cream/80 mb-8 max-w-2xl mx-auto">
            Junte-se aos experts que já elevaram o nível de seus vídeos com a Media 8.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href={contactInfo.whatsappLink} target="_blank" rel="noopener noreferrer">
              <Button size="xl" className="bg-cream text-primary hover:bg-cream/90">
                <MessageCircle className="h-5 w-5 mr-2" />
                Falar no WhatsApp
              </Button>
            </a>
            <Link to="/login">
              <Button size="xl" variant="outline" className="border-cream/30 text-cream hover:bg-cream/10">
                Acessar Dashboard
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// Footer
const Footer: React.FC = () => {
  return (
    <footer className="bg-foreground text-background py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-cream flex items-center justify-center">
                <span className="text-primary font-bold text-lg">M8</span>
              </div>
              <span className="font-bold text-xl text-cream">Media 8</span>
            </div>
            <p className="text-cream/60 max-w-sm">
              Edição estratégica de vídeos para experts, mentores e marcas que buscam autoridade
              digital e conversão.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-cream mb-4">Links</h4>
            <ul className="space-y-2 text-cream/60">
              <li>
                <Link to="/login" className="hover:text-cream transition-colors">
                  Área do Cliente
                </Link>
              </li>
              <li>
                <a href="#portfolio" className="hover:text-cream transition-colors">
                  Portfólio
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-cream transition-colors">
                  Planos
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-cream mb-4">Contato</h4>
            <ul className="space-y-3 text-cream/60">
              <li>
                <a
                  href={`mailto:${contactInfo.email}`}
                  className="flex items-center gap-2 hover:text-cream transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  {contactInfo.email}
                </a>
              </li>
              <li>
                <a
                  href={contactInfo.whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-cream transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  {contactInfo.whatsapp}
                </a>
              </li>
              <li>
                <a
                  href={`https://${contactInfo.behance}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-cream transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  Behance
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-cream/10 pt-8 text-center text-cream/40 text-sm">
          <p>© {new Date().getFullYear()} Media 8. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

// Back to Top Button
const BackToTopButton: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 500) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 p-3 bg-primary text-cream rounded-full shadow-lg hover:bg-wine-warm transition-colors"
          aria-label="Voltar ao topo"
        >
          <ChevronUp className="h-6 w-6" />
        </motion.button>
      )}
    </AnimatePresence>
  );
};

// Main Landing Page Component
const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen">
      <LandingHeader />
      <HeroSection />
      <MethodSection />
      <PortfolioSection />
      <PricingSection />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
      <Footer />
      <BackToTopButton />
    </div>
  );
};

export default LandingPage;
