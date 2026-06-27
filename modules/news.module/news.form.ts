import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { NewsFormSchema, type NewsFormDTO } from "./dto";
import type { News } from "./index";

export function useNewsForm(news?: News) {
  return useForm<NewsFormDTO>({
    defaultValues: news
      ? { judul: news.judul, konten: news.konten, bannerUrl: news.bannerUrl }
      : { judul: "", konten: "", bannerUrl: null },
    mode: "onTouched",
    resolver: zodResolver(NewsFormSchema),
  });
}
