/** Sentinel id for the system default pictogram catalog (not a DB board row). */
export const DEFAULT_BOARD_ID = "default";

export function isDefaultBoardId(boardId: string | null | undefined): boolean {
  return !boardId || boardId === DEFAULT_BOARD_ID;
}
