import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const activeCelebrationQuery = queryOptions({
  queryKey: ["celebration", "active"],
  queryFn: async () => {
    const { data } = await supabase.from("celebrations").select("*").in("status", ["live", "paused"]).maybeSingle();
    return data;
  },
});

export const archivesQuery = queryOptions({
  queryKey: ["celebrations", "ended"],
  queryFn: async () => {
    const { data, error } = await supabase.from("celebrations").select("*").eq("status", "ended").order("started_at", { ascending: false }).limit(200);
    if (error) throw error;
    return data;
  },
});

export const celebrationQuery = (id: string) =>
  queryOptions({
    queryKey: ["celebration", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("celebrations").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const segmentsQuery = (id: string) =>
  queryOptions({
    queryKey: ["segments", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("segments").select("*").eq("celebration_id", id).order("seq");
      if (error) throw error;
      return data;
    },
  });

export const eventsQuery = queryOptions({
  queryKey: ["events"],
  queryFn: async () => {
    const { data, error } = await supabase.from("events").select("*").order("starts_at");
    if (error) throw error;
    return data;
  },
});
