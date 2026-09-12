import type { CourseOutline } from "@/lib/supabase/types";

export function formatCoursePrice(price: number) {
  return price === 0
    ? "Free"
    : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(price);
}

export type CourseModuleOutline = {
  id: string;
  title: string;
  description: string | null;
  sortOrder: number;
  lessons: Array<{ id: string; title: string; description: string | null; sortOrder: number }>;
};

export function groupCourseOutline(rows: CourseOutline[]): CourseModuleOutline[] {
  const modules = new Map<string, CourseModuleOutline>();
  for (const row of rows) {
    const courseModule = modules.get(row.module_id) ?? {
      id: row.module_id,
      title: row.module_title,
      description: row.module_description,
      sortOrder: row.module_sort_order,
      lessons: [],
    };
    if (row.lesson_id && row.lesson_title) {
      courseModule.lessons.push({
        id: row.lesson_id,
        title: row.lesson_title,
        description: row.lesson_description,
        sortOrder: row.lesson_sort_order ?? 0,
      });
    }
    modules.set(row.module_id, courseModule);
  }
  return [...modules.values()]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((courseModule) => ({ ...courseModule, lessons: courseModule.lessons.sort((a, b) => a.sortOrder - b.sortOrder) }));
}
