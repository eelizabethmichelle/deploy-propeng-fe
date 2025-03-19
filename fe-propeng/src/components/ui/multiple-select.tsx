import React, { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverAnchor } from "@/components/ui/popover";
import { ChevronDown, X } from "lucide-react";

interface DataItem {
  id?: string;
  value?: string;
  name: string;
}

interface SelectPillsProps {
  data: DataItem[];
  defaultValue?: string[];
  value?: string[];
  onValueChange?: (selectedValues: string[]) => void;
  placeholder?: string;
}

export const SelectPills: React.FC<SelectPillsProps> = ({
  data,
  defaultValue = [],
  value,
  onValueChange,
  placeholder = "Type to search...",
}) => {
  const [inputValue, setInputValue] = useState<string>("");
  const [selectedPills, setSelectedPills] = useState<string[]>(value || defaultValue);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const radioGroupRef = useRef<HTMLDivElement>(null);

  const filteredItems = data.filter(
    (item) =>
      item.name.toLowerCase().includes(inputValue.toLowerCase()) &&
      !selectedPills.includes(item.name)
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setIsOpen(true);
  };

  const handleItemSelect = (item: DataItem) => {
    const newSelectedPills = [...selectedPills, item.name];
    setSelectedPills(newSelectedPills);
    setInputValue("");
    setIsOpen(false);
    if (onValueChange) onValueChange(newSelectedPills);
  };

  const handlePillRemove = (pill: string) => {
    const newSelectedPills = selectedPills.filter((p) => p !== pill);
    setSelectedPills(newSelectedPills);
    if (onValueChange) onValueChange(newSelectedPills);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex flex-wrap gap-2 min-h-12">

        {(value || selectedPills).map((pill) => (
          <Badge
            key={pill}
            variant="outline"
            onClick={() => handlePillRemove(pill)}
            className="hover:cursor-pointer gap-1 group"
          >
            
            {pill}
            <button onClick={() => handlePillRemove(pill)}>
              <X size={12} />
            </button>
          </Badge>
        ))}
        <PopoverAnchor asChild>
          <div className="relative w-full">
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center justify-between w-full border p-2 rounded-md"
            >
              <span>{placeholder}</span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </PopoverAnchor>
      </div>

      <PopoverContent className="p-2 w-72 text-md">
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="mb-2"
        />
        <div ref={radioGroupRef} className="max-h-40 overflow-y-auto">
          {filteredItems.map((item, index) => (
            <div
              key={item.id || item.value || item.name}
              className={cn(
                "cursor-pointer p-2 hover:bg-gray-100 rounded",
                highlightedIndex === index && "bg-gray-200"
              )}
              onClick={() => handleItemSelect(item)}
            >
              {item.name}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};