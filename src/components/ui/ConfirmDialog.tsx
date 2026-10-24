import { Button } from './Button';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  abierto: boolean;
  titulo: string;
  mensaje: string;
  textoConfirmar: string;
  peligro?: boolean;
  cargando?: boolean;
  onConfirmar: () => void;
  onCerrar: () => void;
}

export const ConfirmDialog = ({
  abierto,
  titulo,
  mensaje,
  textoConfirmar,
  peligro,
  cargando,
  onConfirmar,
  onCerrar,
}: ConfirmDialogProps) => (
  <Modal
    abierto={abierto}
    onCerrar={onCerrar}
    titulo={titulo}
    ancho="sm"
    pie={
      <>
        <Button variante="secundario" onClick={onCerrar}>
          Volver
        </Button>
        <Button variante={peligro ? 'peligro' : 'primario'} cargando={cargando} onClick={onConfirmar}>
          {textoConfirmar}
        </Button>
      </>
    }
  >
    <p className="text-sm text-ink-soft">{mensaje}</p>
  </Modal>
);
