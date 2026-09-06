import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";

import { SafeImage } from "@/components/media";
import type { Category } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { fadeUp } from "@/lib/motion";

export function CategoryCard({ category }: { category: Category & { count: number } }) {
  const { lang } = useI18n();
  const label = lang === "te" && category.name_te ? category.name_te : category.name;

  return (
    <motion.div variants={fadeUp} whileTap={{ scale: 0.95 }} whileHover={{ y: -2 }}>
      <Link
        to="/search"
        search={{ category: category.slug }}
        className="flex w-full flex-col items-center gap-2"
        aria-label={`Browse ${category.name}`}
      >
        <span className="relative grid h-[68px] w-[68px] place-items-center overflow-hidden rounded-3xl bg-secondary ring-1 ring-border">
          <SafeImage path={category.image_url} alt={category.name} className="h-full w-full" />
        </span>
        <span className="text-center">
          <span className="block text-xs font-semibold leading-tight">{label}</span>
          <span className="block text-[11px] text-muted-foreground">{category.count} listed</span>
        </span>
      </Link>
    </motion.div>
  );
}
