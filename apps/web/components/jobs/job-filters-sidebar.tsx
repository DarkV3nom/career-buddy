"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { PLATFORM_LABELS, EXPERIENCE_OPTIONS, WORKPLACE_OPTIONS, DATE_OPTIONS } from "@/lib/jobs/filter-options";
import type { JobSearchFilters, JobSourcePlatform } from "@/lib/jobs/types";

interface JobFiltersSidebarProps {
  platforms: Set<JobSourcePlatform>;
  onTogglePlatform: (platform: JobSourcePlatform) => void;
  experienceLevel: JobSearchFilters["experienceLevel"] | "";
  onExperienceLevelChange: (value: JobSearchFilters["experienceLevel"] | "") => void;
  workplaceType: JobSearchFilters["workplaceType"] | "";
  onWorkplaceTypeChange: (value: JobSearchFilters["workplaceType"] | "") => void;
  datePostedDays: number;
  onDatePostedDaysChange: (value: number) => void;
  onReset: () => void;
}

// Radio-styled row -- used for the 3 filters that are genuinely
// single-select (workplace type, experience level, date posted) so the
// UI doesn't imply you can pick more than one, the way a checkbox would.
function RadioRow({ label, checked, onSelect }: { label: string; checked: boolean; onSelect: () => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 py-1 text-sm text-foreground">
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
          checked ? "border-primary" : "border-border"
        }`}
      >
        {checked && <span className="h-2 w-2 rounded-full bg-primary" />}
      </span>
      <input type="radio" checked={checked} onChange={onSelect} className="sr-only" />
      {label}
    </label>
  );
}

function CheckRow({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 py-1 text-sm text-foreground">
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="h-4 w-4 rounded border-border accent-primary"
      />
      {label}
    </label>
  );
}

/**
 * Left filter panel, styled after the reference's collapsible
 * checkbox-list sidebar. Sources (which sites to search) is genuinely
 * multi-select, so it's real checkboxes; workplace type / experience
 * level / date posted are each single-select underneath (JobSearchFilters
 * only allows one value each), so those render as radio rows instead --
 * visually close to the reference but honest about what can be combined.
 * No fabricated result counts next to each option (the reference shows
 * per-filter counts like "159") since we have no precomputed numbers to
 * show before a search actually runs.
 */
export function JobFiltersSidebar({
  platforms,
  onTogglePlatform,
  experienceLevel,
  onExperienceLevelChange,
  workplaceType,
  onWorkplaceTypeChange,
  datePostedDays,
  onDatePostedDaysChange,
  onReset,
}: JobFiltersSidebarProps) {
  return (
    <div className="flex flex-col gap-1">
      <Accordion type="multiple" defaultValue={["sources", "workplace", "experience", "date"]}>
        <AccordionItem value="sources">
          <AccordionTrigger className="text-sm font-semibold">Sources</AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col">
              {(Object.keys(PLATFORM_LABELS) as JobSourcePlatform[]).map((platform) => (
                <CheckRow
                  key={platform}
                  label={PLATFORM_LABELS[platform]}
                  checked={platforms.has(platform)}
                  onToggle={() => onTogglePlatform(platform)}
                />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="workplace">
          <AccordionTrigger className="text-sm font-semibold">Workplace Type</AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col">
              {WORKPLACE_OPTIONS.map((opt) => (
                <RadioRow
                  key={opt.value || "any"}
                  label={opt.label}
                  checked={workplaceType === opt.value}
                  onSelect={() => onWorkplaceTypeChange(opt.value)}
                />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="experience">
          <AccordionTrigger className="text-sm font-semibold">Experience Level</AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col">
              {EXPERIENCE_OPTIONS.map((opt) => (
                <RadioRow
                  key={opt.value || "any"}
                  label={opt.label}
                  checked={experienceLevel === opt.value}
                  onSelect={() => onExperienceLevelChange(opt.value)}
                />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="date">
          <AccordionTrigger className="text-sm font-semibold">Date Posted</AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col">
              {DATE_OPTIONS.map((opt) => (
                <RadioRow
                  key={opt.value}
                  label={opt.label}
                  checked={datePostedDays === opt.value}
                  onSelect={() => onDatePostedDaysChange(opt.value ?? 0)}
                />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Button variant="outline" size="sm" onClick={onReset} className="mt-3">
        Reset Filters
      </Button>
    </div>
  );
}
