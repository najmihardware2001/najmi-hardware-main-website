import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
type StockRow={id:number;product_id:number;sku:string;original_inventory_code:string;inventory_quantity:number|null;selling_unit:string;size_value:string;size_unit:string;length_value:string;length_unit:string;color:string;mapping_status:string;name_en:string;source_id:string};
export default function AdminInventory(){
 const [rows,setRows]=useState<StockRow[]>([]),[total,setTotal]=useState(0),[search,setSearch]=useState(''),[stock,setStock]=useState(''),[scope,setScope]=useState('MASTER46'),[page,setPage]=useState(0),[error,setError]=useState(''),[loading,setLoading]=useState(false),[version,setVersion]=useState(0);
 const [edit,setEdit]=useState<StockRow|null>(null),[quantity,setQuantity]=useState(''),[reason,setReason]=useState(''),[saving,setSaving]=useState(false);
 useEffect(()=>{let active=true;setLoading(true);setError('');const query=new URLSearchParams({search,stock,scope,limit:'100',offset:String(page*100)});
  api.catalogue('/admin/inventory?'+query).then(data=>{if(active){setRows(data.items);setTotal(data.total)}}).catch(e=>{if(active)setError(e.message)}).finally(()=>{if(active)setLoading(false)});return()=>{active=false};
 },[search,stock,scope,page,version]);
 const save=async(e:React.FormEvent)=>{e.preventDefault();if(!edit||quantity==='')return;setSaving(true);setError('');try{await api.adjustInventory(String(edit.id),Number(quantity),reason);setEdit(null);setVersion(v=>v+1)}catch(e:any){setError(e.message)}finally{setSaving(false)}};
 return <div style={{display:'grid',gap:24}}>
  <div><h1>Inventory</h1><p>Original source records and verified available quantities. Unknown inventory requires a physical count. Stock adjustments preserve identity and pricing approvals.</p></div>
  <div style={{display:'flex',flexWrap:'wrap',gap:12}}>
   <input aria-label="Search inventory" placeholder="Product, original inventory code or SKU…" value={search} onChange={e=>{setSearch(e.target.value);setPage(0)}} style={{padding:10,minWidth:0,flex:'1 1 240px'}}/>
   <select aria-label="Inventory collection" value={scope} onChange={e=>{setScope(e.target.value);setPage(0)}}><option value="MASTER46">Selected catalogue</option><option value="ALL">All historical products</option></select>
   <select aria-label="Stock status" value={stock} onChange={e=>{setStock(e.target.value);setPage(0)}}><option value="">All stock states</option><option value="UNKNOWN">Needs confirmation</option><option value="IN_STOCK">Verified quantity &gt; 0</option><option value="OUT_OF_STOCK">Verified zero stock</option></select>
   <button className="btn btn-outline" onClick={()=>setVersion(v=>v+1)}>Refresh</button>
  </div>
  {error&&<p role="alert" className="admin-error">{error}</p>}
  <p role="status">{loading?'Loading inventory…':`${total.toLocaleString()} source records`}</p>
  <div className="card" style={{overflowX:'auto'}}><table className="data-table" style={{minWidth:900,width:'100%'}}><thead><tr><th>Original code / SKU</th><th>Product</th><th>Source specifications</th><th>Unit</th><th>Verified available</th><th>Mapping</th><th>Actions</th></tr></thead>
   <tbody>{rows.map(row=><tr key={row.id}><td>{row.original_inventory_code||row.sku||'Unassigned'}</td><td>{row.name_en}<br/><small>{row.source_id}</small></td><td>{[row.size_value&&`${Number(row.size_value)} ${row.size_unit}`,row.length_value&&`${Number(row.length_value)} ${row.length_unit}`,row.color].filter(Boolean).join(' · ')||'Needs specification review'}</td><td>{row.selling_unit||'Needs confirmation'}</td><td>{row.inventory_quantity==null?'Needs confirmation':Number(row.inventory_quantity).toLocaleString()}</td><td>{row.mapping_status||(row.sku?'Legacy record':'Needs confirmation')}</td><td><button className="btn btn-outline" onClick={()=>{setEdit(row);setQuantity(row.inventory_quantity==null?'':String(row.inventory_quantity));setReason('')}}>Verify stock</button> <Link to="/admin/products">Review product</Link></td></tr>)}</tbody>
  </table></div>
  <div className="admin-pagination"><button disabled={!page||loading} onClick={()=>setPage(p=>p-1)}>Previous</button><span>{total?`${page*100+1}–${Math.min((page+1)*100,total)} of ${total.toLocaleString()}`:'0 records'}</span><button disabled={(page+1)*100>=total||loading} onClick={()=>setPage(p=>p+1)}>Next</button></div>
  {edit&&<div style={{position:'fixed',inset:0,zIndex:100,display:'grid',placeItems:'center',padding:20,background:'#0007'}}><section role="dialog" aria-modal="true" aria-label="Verify stock" className="card" style={{padding:24,width:'100%',maxWidth:480}}>
   <h2>Verify stock</h2><p>{edit.name_en} · {edit.original_inventory_code||edit.sku}</p><p>Enter the physically verified quantity in the original unit: {edit.selling_unit||'confirm source unit first'}.</p>
   <form onSubmit={save} style={{display:'grid',gap:12,marginTop:20}}><label>Verified quantity<input required type="number" min="0" max="100000000" step="1" value={quantity} onChange={e=>setQuantity(e.target.value)}/></label><label>Reason / physical count reference<input required minLength={5} maxLength={1000} value={reason} onChange={e=>setReason(e.target.value)}/></label>{error&&<p role="alert">{error}</p>}<button disabled={saving} className="btn btn-primary">Save verified quantity</button><button type="button" onClick={()=>setEdit(null)}>Cancel</button></form>
  </section></div>}
 </div>;
}
