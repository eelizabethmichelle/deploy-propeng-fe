import * as React from "react";
import { CheckIcon, PlusCircledIcon } from "@radix-ui/react-icons";
import { Column } from "@tanstack/react-table";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

interface DataTableFacetedFilterProps<TData, TValue> {
  column?: Column<TData, TValue>;
  title?: string;
  options: {
    label: string;
    value: string;
    icon?: React.ComponentType<{ className?: string }>;
  }[];
}

export function DataTableFacetedFilter<TData, TValue>({
  column,
  title,
  options
}: DataTableFacetedFilterProps<TData, TValue>) {
  const facets = column?.getFacetedUniqueValues();
  const selectedValues = new Set(column?.getFilterValue() as string[]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed">
          <PlusCircledIcon className="mr-2 h-4 w-4" />
          {title}
          {selectedValues?.size > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal lg:hidden"
              >
                {selectedValues.size}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {selectedValues.size > 2 ? (
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 font-normal"
                  >
                    {selectedValues.size} selected
                  </Badge>
                ) : (
                  options
                    .filter((option) => selectedValues.has(option.value))
                    .map((option) => (
                      <Badge
                        variant="secondary"
                        key={option.value}
                        className="rounded-sm px-1 font-normal"
                      >
                        {option.label}
                      </Badge>
                    ))
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        {/* Use type assertions to bypass TypeScript errors */}
        {React.createElement(Command as any, {}, [
          React.createElement(CommandInput as any, { placeholder: title, key: "input" }),
          React.createElement(CommandList as any, { key: "list" }, [
            React.createElement(CommandEmpty as any, { key: "empty" }, "No results found."),
            React.createElement(CommandGroup as any, { key: "group" }, 
              options.map((option) => {
                const isSelected = selectedValues.has(option.value);
                return React.createElement(CommandItem as any, {
                  key: option.value,
                  onSelect: () => {
                    if (isSelected) {
                      selectedValues.delete(option.value);
                    } else {
                      selectedValues.add(option.value);
                    }
                    const filterValues = Array.from(selectedValues);
                    column?.setFilterValue(
                      filterValues.length ? filterValues : undefined
                    );
                  }
                }, [
                  <div
                    key="checkbox"
                    className={cn(
                      "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "opacity-50 [&_svg]:invisible"
                    )}
                  >
                    <CheckIcon className={cn("h-4 w-4")} />
                  </div>,
                  option.icon && 
                    React.createElement(option.icon, { 
                      className: "mr-2 h-4 w-4 text-muted-foreground",
                      key: "icon" 
                    }),
                  <span key="label">{option.label}</span>,
                  facets?.get(option.value) && (
                    <span key="count" className="ml-auto flex h-4 w-4 items-center justify-center font-mono text-xs">
                      {facets.get(option.value)}
                    </span>
                  )
                ]);
              })
            ),
            selectedValues.size > 0 && [
              React.createElement(CommandSeparator as any, { key: "separator" }),
              React.createElement(CommandGroup as any, { key: "clear-group" }, 
                React.createElement(CommandItem as any, {
                  key: "clear",
                  onSelect: () => column?.setFilterValue(undefined),
                  className: "justify-center text-center"
                }, "Clear filters")
              )
            ]
          ].flat().filter(Boolean))
        ])}
      </PopoverContent>
    </Popover>
  );
}
