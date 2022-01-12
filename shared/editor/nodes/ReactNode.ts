import { ComponentProps } from "../lib/ComponentView";
import Node from "./Node";

export default abstract class ReactNode extends Node {
  abstract component({
    node,
    isSelected,
    isEditable,
  }: Omit<ComponentProps, "theme">): React.ReactElement;
}
