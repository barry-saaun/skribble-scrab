function CanvasPlaceholder({
  drawerID,
  myPlayerID,
}: {
  drawerID: string | null;
  myPlayerID: string;
}) {
  const isDrawer = drawerID === myPlayerID;
  return (
    <div className="rounded border border-neutral-700 bg-neutral-900 flex-1 flex items-center justify-center min-h-96">
      <p className="text-neutral-600 italic text-sm">
        Canvas goes here{isDrawer ? " — you are drawing" : ""}
      </p>
    </div>
  );
}

export default CanvasPlaceholder;
