import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import { Package } from "@/services/packageService";

interface DeletePackageDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  packageToDelete: Package | null;
  onConfirm: () => Promise<void>;
}

export function DeletePackageDialog({
  isOpen,
  onOpenChange,
  packageToDelete,
  onConfirm,
}: DeletePackageDialogProps) {
  const [confirmName, setConfirmName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    if (confirmName !== packageToDelete?.name) return;
    
    setIsLoading(true);
    try {
      await onConfirm();
      setConfirmName(""); // Reset on success
      onOpenChange(false);
    } catch (error) {
      // Error handling is managed by the parent via Toast
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const isMatched = packageToDelete && confirmName === packageToDelete.name;

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Excluir Pacote Permanentemente
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3 pt-3">
            <p className="text-foreground font-medium">
              Você está prestes a excluir o pacote <span className="font-bold text-destructive">"{packageToDelete?.name}"</span>.
            </p>
            <p>
              Esta ação é <span className="font-bold">irreversível</span>. Se houver vendas associadas a este pacote, a exclusão será bloqueada pelo sistema para preservar o histórico.
            </p>
            <p className="text-sm text-muted-foreground">
              Para confirmar, digite o nome do pacote abaixo:
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-2">
          <Input
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
            placeholder={packageToDelete?.name}
            className="border-destructive/30 focus-visible:ring-destructive/30"
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setConfirmName("")} disabled={isLoading}>
            Cancelar
          </AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={!isMatched || isLoading}
            onClick={handleConfirm}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Excluir Pacote
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
