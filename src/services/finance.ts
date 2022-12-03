import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEBTS_INSTITUTION } from "../constants/debts.constants";
import { ASYNC_FINANCES } from "../constants/storage.constant";
import { FinanceBalance, FinanceBalancePerCategory, FinanceDto, FinanceEntity, FinancesBalanceEntity } from "../interfaces/services/finance.interface";
import { Services } from "../interfaces/services/service.interface";
import { getPipeDateTimeString } from "../utils/date.util";
import { getPipeMoneyNumber } from "../utils/money.util";
import { AppCategoryService } from "./category";
import { AppDebtsService } from "./debts";

class Finance implements FinanceEntity {
    id: number;
    name: string;
    description?: string | undefined;
    value: number;
    categoryId: number;
    walletId: number;
    billId: number;
    paidAt: string;
    isPaid: boolean;
    type: "INCOME" | "EXPENSE";
    createdAt: string;
    updatedAt?: string;

    constructor(createFinanceDto: FinanceDto, lastId: number) {
        this.id = lastId + 1;
        this.name = createFinanceDto.name;
        this.categoryId = createFinanceDto?.categoryId ?? 0;
        this.walletId = createFinanceDto.walletId;
        this.type = createFinanceDto.type;
        this.isPaid = createFinanceDto.isPaid;
        this.value = getPipeMoneyNumber(createFinanceDto.money);
        this.paidAt = createFinanceDto.paid;
        this.createdAt = getPipeDateTimeString();
        this.billId = createFinanceDto?.billId ?? 0
    }
}

class FinanceService implements Services<FinanceEntity, FinanceDto>{
    public async find(): Promise<FinanceEntity[]> {
        const finances = await AsyncStorage.getItem(ASYNC_FINANCES);
        if (finances) return JSON.parse(finances);
        return [];
    }

    public async findOne(id: number): Promise<FinanceEntity | undefined> {
        const finances = await this.find();
        return finances.find(finance => finance.id == id);
    }

    public async create(createDto: FinanceDto): Promise<FinanceEntity> {
        if (!createDto?.categoryId && !createDto?.billId) throw new Error("Categoria ou Fatura é obrigatória")

        const finances = await this.find();
        const lastFinance = this.findLast(finances);

        const finance = new Finance(createDto, lastFinance?.id ?? 0);
        finances.push(finance);

        await AsyncStorage.setItem(ASYNC_FINANCES, JSON.stringify(finances));
        return finance;
    }

    public async update(id: number, updateDto: FinanceDto): Promise<FinanceEntity | undefined> {
        const finances = await this.find();
        let finance = finances.find(finance => finance.id == id);
        let index = finances.findIndex(finance => finance.id == id);
        if (!finance) return;

        finance = { ...finance, ...updateDto, value: getPipeMoneyNumber(updateDto.money), paidAt: updateDto.paid }
        finances.splice(index, 1, finance);

        await AsyncStorage.setItem(ASYNC_FINANCES, JSON.stringify(finances));

        return finance
    }

    public async delete(id: number): Promise<FinanceEntity[]> {
        const finances = await this.find();
        const remove = finances.filter(finance => finance.id !== id);
        await AsyncStorage.setItem(ASYNC_FINANCES, JSON.stringify(remove));

        return remove;
    }

    public async getFinancesBalance(month: string, year: string, walletId: number): Promise<FinanceBalance> {
        let total = 0;
        let totalIncome = 0;
        let totalExpense = 0;

        if (!month || !year || !walletId) return {
            total,
            totalIncome,
            totalExpense,
            finances: []
        }

        const finances = await this.find();
        const categories = await AppCategoryService.find()
        const bills = await AppDebtsService.find()

        const financesFilter = finances.map((finance) => {
            const [date] = finance.paidAt.split(" ");
            const [getYear, getMonth] = date.split("-");

            if (month.length == 1) month = month.padStart(2, "0")
            const validateDate = getYear == year && getMonth == month;

            if (finance.walletId == walletId && validateDate) {
                if (finance.isPaid) {
                    if (finance.type == "INCOME") {
                        total += finance.value;
                        totalIncome += finance.value;
                    }
                    if (finance.type == "EXPENSE") {
                        total -= finance.value;
                        totalExpense += finance.value;
                    }
                }

                const category = categories.find(c => c.id == finance.categoryId);
                const getBill = bills.find(bill => bill.id == finance.billId);
                const bill = DEBTS_INSTITUTION.find(bill => bill.id == getBill?.institutionId);

                return { ...finance, category, bill };
            }
        }).filter(item => item) as FinancesBalanceEntity[];

        return {
            total,
            totalIncome,
            totalExpense,
            finances: financesFilter.sort((a, b) => b.id - a.id)
        }
    }

    public async getFinancesBalancePerCategory(month: string, year: string, walletId: number): Promise<FinanceBalance & { categories: FinanceBalancePerCategory[] }> {
        const balances = await this.getFinancesBalance(month, year, walletId);
        const perCategory: FinanceBalancePerCategory[] = [];

        for (const balance of balances.finances) {
            const category = perCategory.find(category => category?.category?.id == balance.categoryId);
            if (category?.total) {
                category.total += balance.value;
                continue
            }

            perCategory.push({
                category: balance.category,
                total: balance.value
            })
        }

        return { ...balances, categories: perCategory }
    }

    protected findLast(finances: FinanceEntity[]): FinanceEntity | undefined {
        return finances[finances.length - 1];
    }
}

export const AppFinanceService = new FinanceService()