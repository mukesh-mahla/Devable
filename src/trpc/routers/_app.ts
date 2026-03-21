
import {  createTRPCRouter } from "../init";

import { messageRouterr } from "@/modules/messages/server/procedures";
export const appRouter = createTRPCRouter({
  messages:messageRouterr
});
// export type definition of API
export type AppRouter = typeof appRouter;
