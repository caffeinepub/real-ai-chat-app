import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Message } from "../backend.d";
import { useActor } from "./useActor";

export function useListConversations() {
  const { actor, isFetching } = useActor();
  return useQuery<Array<[bigint, string]>>({
    queryKey: ["conversations"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listConversations();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetHistory() {
  const { actor, isFetching } = useActor();
  return useQuery<Message[]>({
    queryKey: ["history"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getHistory();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetCurrentConversationId() {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ["currentConversationId"],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getCurrentConversationId();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSendMessage() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (message: string) => {
      if (!actor) throw new Error("No actor");
      return actor.sendMessage(message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["history"] });
    },
  });
}

export function useCreateConversation() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error("No actor");
      return actor.createConversation(name);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["currentConversationId"] });
      qc.invalidateQueries({ queryKey: ["history"] });
    },
  });
}

export function useSwitchConversation() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.switchConversation(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["history"] });
      qc.invalidateQueries({ queryKey: ["currentConversationId"] });
    },
  });
}

export function useClearHistory() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.clearHistory();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["history"] });
    },
  });
}
