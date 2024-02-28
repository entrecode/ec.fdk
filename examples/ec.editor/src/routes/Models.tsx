import { ModelTable } from "../components/ModelTable";
import { useNavigate, useParams } from "react-router-dom";
import { MainLayout } from "../layouts/MainLayout";

export function Models() {
  const { shortID } = useParams();
  const navigate = useNavigate();
  return (
    <MainLayout>
      <ModelTable
        shortID={shortID}
        onClick={(model) => navigate(`/dm/${shortID}/model/${model}/entry`)}
      />
    </MainLayout>
  );
}
