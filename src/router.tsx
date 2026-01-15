import { createRouter } from "@tanstack/react-router";
import { QueryClient } from "@tanstack/react-query";

import { routeTree } from "./routeTree.gen";

const queryClient = new QueryClient();

export const getRouter = () => {
  const router = createRouter({
    routeTree,
    context: {
      queryClient,
    },
    basepath: "/spendin",
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
