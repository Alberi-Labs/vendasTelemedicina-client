import { NextApiRequest, NextApiResponse } from "next";
import { IncomingForm, File } from "formidable";
import fs from "fs";
import path from "path";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const uploadDir = path.join(process.cwd(), "public/uploads");

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const form = new IncomingForm({
    uploadDir,
    keepExtensions: true,
  });

  form.parse(req, async (err, fields, files) => {
    if (err || !files.file) {
      console.error("Erro no parse:", err);
      return res.status(500).send("Erro no upload.");
    }

    const uploaded = files.file;
    const file = Array.isArray(uploaded) ? uploaded[0] : uploaded;
    const finalPath = path.join(uploadDir, "relatorio_cobrancas.xlsx");
    fs.renameSync(file.filepath, finalPath);

    const timestamp = new Date().toLocaleString("pt-BR");
    fs.writeFileSync(path.join(uploadDir, "relatorio_cobrancas_timestamp.txt"), timestamp);

    res.status(200).json({ message: "Upload feito com sucesso!", timestamp });
  });
}
