import { getUsageStatus } from "@/lib/usage";
import { protectedProcedure, createTRPCRouter } from "@/trpc/init";

export const usageRouter = createTRPCRouter({
  status: protectedProcedure.query(async () => {
    try {
      const result = await getUsageStatus();
      return result;
    } catch (err) {
      return null;
    }
  }),
});
