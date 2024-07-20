export interface Artifact {
    identifier: string;
    type: string;
    language: string;
    title: string;
    content: string;
}

export interface CodeProps {
    node?: any;
    inline?: any;
    className?: any;
    children?: any;
}
