import { coinHoldersAddr } from "./type";

export function renderHolders(source: coinHoldersAddr) {
    const toplist = source.data.toplist
    if (toplist.length === 0) {
        return "暂无数据"
    }
    let toplistxml = []
    for (var i in toplist.slice(0, 10)) {
        const tr =
            <tr>
                <td >{i+1}</td>
                <td >{toplist?.[i]?.address ?? ""}</td>
                <td>{toplist?.[i]?.quantity ?? ""}</td>
                <td>{toplist?.[i]?.percentage ?? ""}</td>
                <td>{toplist?.[i]?.change_abs ?? ""}</td>
            </tr>;
        toplistxml.push(tr)
    }
    return <html>
        <div><table border="1">
            <thead>
                <tr>
                    <th>#</th>
                    <th>钱包地址</th>
                    <th>持仓数量</th>
                    <th>持仓占比</th>
                    <th>7D变化</th>
                </tr>
            </thead>
            <tbody>
                {toplistxml}
            </tbody>
        </table >
        </div>
    </html>
}

