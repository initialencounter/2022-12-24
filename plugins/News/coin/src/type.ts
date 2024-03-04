export const coinAlias = {
    "bitcoin": ["btc","比特币"],
    "ethereum": ["eth","以太坊","ETH"],
    "tether": ["usdt","泰达币","USDT"],
    "ripple": ["xrp","瑞波币","XRP"],
    "litecoin": ["ltc","莱特币","LTC"],
    "bitcoin-cash": ["bch","比特币现金","BCH"],
    "cardano": ["ada","卡尔达诺","ADA"],
    "polkadot100": ["dot","波卡币","DOT"],
    "chainlink": ["link","链链接","LINK"],
    "stellar": ["xlm","恒星币","XLM"],
    "binance-coin": ["bnb","币安币","BNB"],
    "usdc": ["usdc","美元稳定币","USDC"],
    "solana": ["sol","索拉币","SOL"],
    "dogecoin": ["doge","狗狗币","DOGE"],
    "uniswap": ["uni","Uniswap"],
    "avalanche": ["avax","雪崩币","AVAX"],
    "shibainu": ["SHIB"],
    "tron": ["TRX"],
    "matictoken": ["MATIC"],
    "toncoin": ["TON"],
    "wrapped-bitcoin": ["WBTC"],
    "cosmos": ["atom","宇宙币","ATOM"],
    "eos": ["eos","柚子币","EOS"],
};



export type coinHoldersAddr = {
    data: {
        top: {
            updatedate: string,
            addrcount: number,
            top10rate: number,
            top20rate: number,
            top50rate: number,
            top100rate: number
        },
        maincoins: [],
        toplist: holders[],
        holders: holders[],
        flows: holders[],
        holdcoin: {
            summary: {
                rise: number,
                riserate: number,
                addrcount: number,
                updatedate: string
            },
            list: [
                {
                    updatedate: number,
                    addrcount: number,
                    top10rate: number,
                    top20rate: number,
                    top50rate: number,
                    top100rate: number,
                }
            ]
        },
        code: number,
        msg: string
    }
}

type holders = {
    address: string,
    quantity: number,
    percentage: number,
    platform: string,
    platform_name: string,
    logo: string,
    change: number,
    blockurl: string,
    change_abs: number,
    updatetime: string,
    hidden: number,
    destroy: number,
    iscontract: number,
    addressflag: string
}