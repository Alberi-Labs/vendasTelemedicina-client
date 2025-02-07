import Link from "next/link";
import React from "react";




export default function PagiginaInicial() {
    return (
        <div className="d-flex h-screen justify-content-center align-items-center">
            <h3>Aqui você pode realizar vendas PF - Pessoa Física ou PJ - Pessoa Jurídica</h3>
            <p className="lead text-sencondary"></p>
            <Link href="/vendaPj">Venda Individual</Link>
        </div>
    );
}