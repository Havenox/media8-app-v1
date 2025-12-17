import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ShoppingBag, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ServiceBalanceList } from '@/components/dashboard/ServiceBalanceList';

export const ServiceInventory: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Seus Serviços Contratados (Snapshots)
          </h2>
          <p className="text-sm text-muted-foreground">
            Saldos e contratos ativos (Blindagem de Contrato Ativa)
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* 
          <Link to="/services">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              Ver Todos
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
          */}
          <Link to="/">
            <Button variant="outline" size="sm">
              <ShoppingBag className="h-4 w-4" />
              Contratar Mais
            </Button>
          </Link>
        </div>
      </div>

      {/* Unified List */}
      <ServiceBalanceList className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3" canConsume={false} />
      
    </motion.div>
  );
};

export default ServiceInventory;
