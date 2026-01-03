export interface Room {
    id: string;
    isPrivate: boolean;
    hasPassword?: boolean;
    roomName?: string;
    roomCode?: string;
    players: number;
    maxPlayers: number;
    status: 'waiting' | 'playing';
    hostName: string;
    hostAvatar?: string;
    player1?: {
        odiumInfo?: {
            displayName: string;
            level: number;
            rank: string;
        }
    }
}
