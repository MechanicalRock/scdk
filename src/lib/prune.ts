import { Portfolio, ProvisioningArtifact } from "./model";
import semver, { major } from "semver";

const RE = /^v(?<major>\d)+(\.(?<minor>\d+))(\.(?<patch>\d+))$/;

function sort(artifacts: ProvisioningArtifact[]): ProvisioningArtifact[] {
    const tmp = artifacts.filter((pa) => RE.test(pa.Name)).sort((a, b) => (semver.gt(a.Name, b.Name) ? -1 : 1));
    const majors = Array.from(new Set(tmp.map((pa) => major(pa.Name))));
    return majors.map((major) => tmp.find((pa) => pa.Name.startsWith(`v${major}`))) as any;
}

export function pruneVersions({ Products }: Portfolio): Portfolio {
    const products = Products.map(({ Name, ProvisioningArtifacts }) => ({
        Name,
        ProvisioningArtifacts: sort(ProvisioningArtifacts),
    }));
    return {
        Products: products.filter(({ ProvisioningArtifacts: pa }) => pa.length > 0),
    };
}
