import React, { useState, useMemo } from 'react';
import { InfiniteCombobox } from "@/components/ui/infinite-combobox";
import { useInfiniteUsers } from "@/hooks/useUsers";
import { useDebounce } from "@/hooks/useDebounce";
import { UserRole } from "@/types/api";

interface UserSelectProps {
  value?: string;
  onChange: (userId: string) => void;
  role?: UserRole; // Optional role filter
  placeholder?: string;
  className?: string;
}

export function UserSelect({ 
  value, 
  onChange, 
  role, 
  placeholder = "Selecione um usuário...",
  className 
}: UserSelectProps) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  const { 
    data, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage, 
    isLoading 
  } = useInfiniteUsers(role, 20, debouncedSearch);

  const users = useMemo(() => {
    return data?.pages.flatMap((page) => page) ?? [];
  }, [data]);

  return (
    <InfiniteCombobox
      items={users}
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
        renderItem={(user) => (
          <div className="flex flex-col">
            <span className="font-medium">{user.Name}</span>
            <span className="text-xs text-muted-foreground">{user.Email}</span>
          </div>
        )}
        getLabel={(user) => user.Name}
        getValue={(user) => user.Id}
    />
  );
}
