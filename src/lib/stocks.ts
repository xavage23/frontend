import type { Stock } from "./generated";

export const getAveragePrice = (stock: Stock) => {
    // Take the prices and add them first
    let price = 0
    let numberOfPrices = 0;
    price += (stock?.known_prices || []).reduce((a, b) => a + b);
    numberOfPrices += (stock?.known_prices || []).length;

    // Next add prior prices
    for(let pp of stock?.prior_prices || []) {
        price += pp.prices.reduce((a, b) => a + b);
        numberOfPrices += pp.prices.length;
    }

    return price / numberOfPrices;
}
