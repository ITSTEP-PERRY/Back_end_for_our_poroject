type Props = {
  text: string;
};

export function AdminEmptyBlob({ text }: Props) {
  return (
    <div className="ap-empty ap-empty--figma">
      <img className="ap-empty__blob" src="/icons/admin/empty-blob.svg" alt="" width={220} height={160} />
      <p className="ap-empty__text">{text}</p>
    </div>
  );
}
