import { DatamanagerTable } from "../components/DatamanagerTable";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "../layouts/MainLayout";

export function Dms() {
  const navigate = useNavigate();
  return (
    <MainLayout>
      <DatamanagerTable
        onClick={(shortID) => navigate(`/dm/${shortID}/model`)}
      />
    </MainLayout>
  );
}
