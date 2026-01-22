"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { 
  Search, 
  Filter, 
  X, 
  SlidersHorizontal,
  Clock,
  TrendingUp,
  Target
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MARKET_CATEGORIES,
  ORACLE_TYPES,
  TIME_FILTERS,
  STAKE_FILTERS,
  PROBABILITY_FILTERS,
  SORT_OPTIONS,
  getAllCategories,
  getAllOracleTypes
} from "@/constants/market-categories";

export interface MarketFilters {
  search: string;
  categories: string[];
  oracleTypes: string[];
  timeframe: string;
  stakeRange: string;
  probabilityRange: string;
  sortBy: string;
}

interface MarketFiltersProps {
  filters: MarketFilters;
  onFiltersChange: (filters: MarketFilters) => void;
  totalMarkets: number;
  filteredCount: number;
}

export function MarketFilters({ 
  filters, 
  onFiltersChange, 
  totalMarkets, 
  filteredCount 
}: MarketFiltersProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const updateFilter = (key: keyof MarketFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleCategory = (categoryId: string) => {
    const newCategories = filters.categories.includes(categoryId)
      ? filters.categories.filter(c => c !== categoryId)
      : [...filters.categories, categoryId];
    updateFilter('categories', newCategories);
  };

  const toggleOracleType = (oracleType: string) => {
    const newTypes = filters.oracleTypes.includes(oracleType)
      ? filters.oracleTypes.filter(t => t !== oracleType)
      : [...filters.oracleTypes, oracleType];
    updateFilter('oracleTypes', newTypes);
  };

  const clearAllFilters = () => {
    onFiltersChange({
      search: '',
      categories: [],
      oracleTypes: [],
      timeframe: 'all',
      stakeRange: 'all',
      probabilityRange: 'all',
      sortBy: 'newest'
    });
  };

  const activeFiltersCount = 
    (filters.search ? 1 : 0) +
    filters.categories.length +
    filters.oracleTypes.length +
    (filters.timeframe !== 'all' ? 1 : 0) +
    (filters.stakeRange !== 'all' ? 1 : 0) +
    (filters.probabilityRange !== 'all' ? 1 : 0);

  return (
    <div className="space-y-4">
      {/* Search and Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search markets..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map(option => (
                <SelectItem key={option.id} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="relative">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge 
                    variant="secondary" 
                    className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Advanced Filters</h4>
                  {activeFiltersCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllFilters}
                      className="text-xs"
                    >
                      Clear All
                    </Button>
                  )}
                </div>

                {/* Categories */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Filter className="h-3.5 w-3.5" />
                    Categories
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {getAllCategories().map(category => {
                      const Icon = category.icon;
                      const isSelected = filters.categories.includes(category.id);
                      return (
                        <Button
                          key={category.id}
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleCategory(category.id)}
                          className="text-xs h-7"
                        >
                          <Icon className="h-3 w-3 mr-1" />
                          {category.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Oracle Types */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Target className="h-3.5 w-3.5" />
                    Market Types
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {getAllOracleTypes().map(oracleType => {
                      const Icon = oracleType.icon;
                      const isSelected = filters.oracleTypes.includes(oracleType.id);
                      return (
                        <Button
                          key={oracleType.id}
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleOracleType(oracleType.id)}
                          className="text-xs h-7"
                        >
                          <Icon className="h-3 w-3 mr-1" />
                          {oracleType.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Time Range */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5" />
                    Time Range
                  </label>
                  <Select value={filters.timeframe} onValueChange={(value) => updateFilter('timeframe', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_FILTERS.map(option => (
                        <SelectItem key={option.id} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Stake Range */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-3.5 w-3.5" />
                    Total Stake
                  </label>
                  <Select value={filters.stakeRange} onValueChange={(value) => updateFilter('stakeRange', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STAKE_FILTERS.map(option => (
                        <SelectItem key={option.id} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Probability Range */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Probability Range</label>
                  <Select value={filters.probabilityRange} onValueChange={(value) => updateFilter('probabilityRange', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROBABILITY_FILTERS.map(option => (
                        <SelectItem key={option.id} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Active Filters Display */}
      <AnimatePresence>
        {activeFiltersCount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2"
          >
            {filters.search && (
              <Badge variant="secondary" className="gap-1">
                Search: "{filters.search}"
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => updateFilter('search', '')}
                />
              </Badge>
            )}
            
            {filters.categories.map(categoryId => {
              const category = MARKET_CATEGORIES[categoryId];
              if (!category) return null;
              return (
                <Badge key={categoryId} variant="secondary" className="gap-1">
                  {category.label}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => toggleCategory(categoryId)}
                  />
                </Badge>
              );
            })}

            {filters.oracleTypes.map(oracleType => {
              const type = ORACLE_TYPES[oracleType];
              if (!type) return null;
              return (
                <Badge key={oracleType} variant="secondary" className="gap-1">
                  {type.label}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => toggleOracleType(oracleType)}
                  />
                </Badge>
              );
            })}

            {filters.timeframe !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                {TIME_FILTERS.find(f => f.value === filters.timeframe)?.label}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => updateFilter('timeframe', 'all')}
                />
              </Badge>
            )}

            {filters.stakeRange !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                Stake: {STAKE_FILTERS.find(f => f.value === filters.stakeRange)?.label}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => updateFilter('stakeRange', 'all')}
                />
              </Badge>
            )}

            {filters.probabilityRange !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                Probability: {PROBABILITY_FILTERS.find(f => f.value === filters.probabilityRange)?.label}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => updateFilter('probabilityRange', 'all')}
                />
              </Badge>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Summary */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredCount.toLocaleString()} of {totalMarkets.toLocaleString()} markets
      </div>
    </div>
  );
}
