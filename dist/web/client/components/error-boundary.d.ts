import React from 'react';
interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
    errorInfo?: React.ErrorInfo;
}
interface ErrorBoundaryProps {
    children: React.ReactNode;
}
export declare class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps);
    handleReset: () => void;
    static getDerivedStateFromError(error: Error): ErrorBoundaryState;
    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void;
    render(): any;
}
export {};
//# sourceMappingURL=error-boundary.d.ts.map