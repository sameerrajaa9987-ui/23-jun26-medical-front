export type LocationType =
  | "warehouse"
  | "zone"
  | "wall"
  | "shelf"
  | "rack"
  | "drawer";

export interface LocationNode {
  id: string;
  type: LocationType;
  name: string;
  code: string;
  segment: string;
  parentId: string | null;
  warehouseId: string | null;
  pathName: string;
  allowedChildTypes: LocationType[];
  isActive: boolean;
  createdAt: string;
}

export interface LocationTreeNode extends LocationNode {
  children: LocationTreeNode[];
}

export interface CreateLocationPayload {
  type: LocationType;
  name?: string;
  parentId?: string | null;
}

export const TYPE_LABELS: Record<LocationType, string> = {
  warehouse: "Warehouse",
  zone: "Zone",
  wall: "Wall",
  shelf: "Shelf",
  rack: "Rack",
  drawer: "Drawer",
};
