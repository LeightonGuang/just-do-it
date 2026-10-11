import type { MoveDORequest, MoveDOResponse } from "./index";

/**
 * Extended move request with optional callback
 */
export interface MoveDOType extends MoveDORequest {
  /** Optional callback when move is complete */
  onMove?: (response: MoveDOResponse) => void;
}