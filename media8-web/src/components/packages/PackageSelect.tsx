import React, { useState, useMemo } from 'react';
import { InfiniteCombobox } from "@/components/ui/infinite-combobox";
import { useInfinitePackages } from "@/hooks/usePackages";
import { useDebounce } from "@/hooks/useDebounce";

interface PackageSelectProps {
  value?: string;
  onChange: (packageId: string) => void;
  placeholder?: string;
  className?: string;
}

export function PackageSelect({ 
  value, 
  onChange, 
  placeholder = "Selecione um pacote...",
  className 
}: PackageSelectProps) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  const { 
    data, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage, 
    isLoading 
  } = useInfinitePackages(20, debouncedSearch);

  const packages = useMemo(() => {
    return data?.pages.flatMap((page) => page) ?? [];
  }, [data]);

  return (
    <InfiniteCombobox
      items={packages}
      isLoading={isLoading}
      isFetchingNextPage={isFetchingNextPage}
      hasNextPage={!!hasNextPage}
      fetchNextPage={fetchNextPage}
      searchValue={search}
      onSearchChange={setSearch}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      renderItem={(pkg) => (
        <div className="flex flex-col">
          <span className="font-medium">{pkg.name}</span>
          <span className="text-xs text-muted-foreground">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pkg.price)}
            {pkg.isPublic ? '' : ' (Privado)'}
          </span>
        </div>
      )}
      getLabel={(pkg) => pkg.name}
      getValue={(pkg) => pkg.id}
    />
  );
}
