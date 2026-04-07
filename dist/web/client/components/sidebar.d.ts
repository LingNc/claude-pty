import type { PTYSessionInfo } from '../../shared/types.ts';
interface SidebarProps {
    sessions: PTYSessionInfo[];
    activeSession: PTYSessionInfo | null;
    onSessionClick: (session: PTYSessionInfo) => void;
    connected: boolean;
}
export declare function Sidebar({ sessions, activeSession, onSessionClick, connected }: SidebarProps): any;
export {};
//# sourceMappingURL=sidebar.d.ts.map