// ==========================================
// Ponto Game - Client Types
// ==========================================

export type CardPosition = 'FW' | 'MF' | 'DF' | 'GK';
export type CardType = 'player' | 'action' | 'ponto';

export interface Card {
    instanceId: string; // Unique ID for this specific card instance in the game
    defId: string; // Reference to CardDefinition ID (e.g., 'fw_basic')
    type: CardType;
    position?: CardPosition;
    name: string;
    description?: string;
    baseAttack?: number;
    baseDefense?: number;
    currentAttack?: number; // Modified by buffs
    currentDefense?: number; // Modified by buffs
    isLegendary?: boolean;
    isRevealed: boolean; // For opponent's cards or hidden info
    isRedCarded?: boolean;
    yellowCards?: number;
}

export type TurnPhase = 'attack' | 'defense' | 'waiting';

export interface GameState {
    playerScore: number;
    opponentScore: number;
    turnPhase: TurnPhase;
    isMyTurn: boolean;
    movesRemaining: number;
    timerSeconds: number;
    matchTimeMinutes: number; // Starts at 0, goes to 20

    hand: Card[]; // My Hand
    field: (Card | null)[]; // My Field (5 slots)

    opponentField: (Card | null)[]; // Opponent Field (masked mostly)

    selectedCardId: string | null;
    selectedSlotIndex: number | null; // For field interactions
}
