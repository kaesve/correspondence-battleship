export const X = 0, Y = 1; 



export const add = (a: number[], b: number[]) : number[] => [ a[X] + b[X], a[Y] + b[Y] ];
export const sub = (a: number[], b: number[]) : number[] => [ a[X] - b[X], a[Y] - b[Y] ];
export const mul = (a: number[], b: number[]) : number[] => [ a[X] * b[X], a[Y] * b[Y] ];
export const div = (a: number[], b: number[]) : number[] => [ a[X] / b[X], a[Y] / b[Y] ];

export const rot90 = (v: number[]) : number[] => [ -v[Y], v[X] ];