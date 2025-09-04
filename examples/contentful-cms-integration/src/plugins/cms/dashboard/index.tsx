import {
  api,
  defineDashboardExtension,
  Button,
  ContextMenu,
} from "@vendure/dashboard";
import { useState } from "react";
// import { graphql } from "../../../gql/graphql";
import { graphql } from "@/gql";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const syncEntityMutation = graphql(`
  mutation SyncEntity($id: ID!, $entityType: String!) {
    syncEntityToCms(id: $id, entityType: $entityType) {
      success
      message
      entityId
      entityType
    }
  }
`);

const SyncButton = ({ context }) => {
  let entityType: string;
  switch (context.pageId) {
    case "product-detail":
      entityType = "Product";
      break;
    case "product-variant-detail":
      entityType = "ProductVariant";
      break;
    case "collection-detail":
      entityType = "Collection";
      break;
    default:
      throw new Error("Invalid pageId");
  }

  const mutation = useMutation({
    mutationFn: api.mutate(syncEntityMutation),
    onSuccess: () => {
      // Invalidate and refetch product queries
      toast.success(`${entityType} synced to CMS`);
    },
    onError: (error) => {
      toast.error(`Failed to sync ${entityType} to CMS`, {
        description: error.message,
      });
    },
  });
  return (
    <Button
      type="button"
      variant="secondary"
      onClick={() =>
        mutation.mutate({ id: context.entity.id, entityType: entityType })
      }
    >
      Sync to CMS
    </Button>
  );
};

export default defineDashboardExtension({
  actionBarItems: [
    {
      pageId: "product-detail",
      component: SyncButton,
    },
    {
      pageId: "product-variant-detail",
      component: SyncButton,
    },
    {
      pageId: "collection-detail",
      component: SyncButton,
    },
  ],
});
