"use client";

import { Danfo, Sign, StreetTree, UtilityPole } from "./parts";

export default function BusStopSide() {
  return (
    <group>
      <group position={[-9, 0, 9]}>
        <mesh position={[0, 0.02, 0]} receiveShadow>
          <planeGeometry args={[13, 12]} />
          <meshStandardMaterial color="#33522e" roughness={1} />
        </mesh>
        <mesh position={[0, 2.2, -5.2]}>
          <Sign text="YABA BUS STOP" color="#7fd4ff" />
        </mesh>
        <mesh position={[0, 2.4, -5.5]} castShadow>
          <boxGeometry args={[5, 0.2, 2.2]} />
          <meshStandardMaterial color="#274b73" roughness={0.7} />
        </mesh>
        {[-2.3, 2.3].map((dx, i) => (
          <mesh key={i} position={[dx, 1.2, -5.5]}>
            <cylinderGeometry args={[0.09, 0.09, 2.4, 8]} />
            <meshStandardMaterial color="#3a3f45" roughness={0.6} metalness={0.5} />
          </mesh>
        ))}
        <mesh position={[0, 0.55, -5.5]}>
          <boxGeometry args={[4.4, 0.12, 0.5]} />
          <meshStandardMaterial color="#7a5c3a" roughness={1} />
        </mesh>
      </group>
      <Danfo position={[-13, 0, 1.5]} rotationY={Math.PI} />
      <UtilityPole position={[4.6, 0, 6.5]} />
      <UtilityPole position={[-4.6, 0, 6.5]} />
      <UtilityPole position={[4.6, 0, -6.5]} />
      <UtilityPole position={[-4.6, 0, -6.5]} />
      <StreetTree position={[12, 0, 7]} />
      <StreetTree position={[-12.5, 0, -3]} s={0.85} />
      <StreetTree position={[12.5, 0, -2]} s={1.1} />
      {[
        [5.2, 7.2],
        [-5.2, -7.2],
      ].map((p, i) => (
        <mesh key={`bin${i}`} position={[p[0], 0.5, p[1]]} castShadow>
          <cylinderGeometry args={[0.4, 0.34, 1.0, 10]} />
          <meshStandardMaterial color="#2f6b3a" roughness={0.9} />
        </mesh>
      ))}
      <group position={[13.5, 0, 12]}>
        {[0, 1, 2].map((r) =>
          [0, 1].map((c) => (
            <mesh key={`${r}${c}`} position={[c * 0.85, 0.25 + r * 0.5, 0]} castShadow>
              <boxGeometry args={[0.8, 0.45, 0.45]} />
              <meshStandardMaterial color="#b8ab90" roughness={1} />
            </mesh>
          )),
        )}
      </group>
    </group>
  );
}
