import { CategoryEntity } from "./category.interface";

interface Budget {
    year: string;
    month: string;
    categories: {
        categoryId: number;
        total: number;
    }[];
}
export interface BudgetDto extends Budget {
    total: string
}

export interface BudgetEntity extends Budget {
    id: number;
    value: number;
    createdAt: string;
    updatedAt?: string;
}

export interface BudgetsBalanceCategory {
    category: CategoryEntity | undefined;
    used: number;
    categoryId: number;
    total: number;
}

export interface BudgetsBalanceEntity {
    categories: BudgetsBalanceCategory[];
    id?: number | undefined;
    value?: number | undefined;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
    year?: string | undefined;
    month?: string | undefined;
    totalExpense: number;
}