"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { HAIR_COLORS, SKIN_TONES } from "./appearance";
import type { Avatar } from "./wardrobe";

function hex(list: { id: string; swatch: string }[], id: string, fallback: string): string {
  return list.find((x) => x.id === id)?.swatch ?? fallback;
}

function mat(color: string, roughness = 0.85): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0, flatShading: true });
}

/** Simple stylized Lagos person — capsule body, sphere head, separate
 *  clothing pieces. Zero downloads, matches the in-world characters. */
export function SimpleAvatar({ avatar }: { avatar: Avatar }) {
  const root = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);

  const female = avatar.body === "female";
  const s = female ? 0.88 : 0.92; // overall scale
  const shoulderW = female ? 0.19 : 0.235;
  const skin = hex(SKIN_TONES, avatar.skin, "#7c4a2b");
  const hairC = hex(HAIR_COLORS, avatar.hair.color, "#241d19");
  const shirt = avatar.top?.color ?? "#2e6b46";
  const pants = avatar.bottom?.color ?? "#2f4a6b";
  const shoeC = avatar.shoes?.color ?? "#eceae6";

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (root.current) root.current.position.y = Math.sin(t * 2.1) * 0.022;
    if (armL.current) armL.current.rotation.x = Math.sin(t * 2.1) * 0.07;
    if (armR.current) armR.current.rotation.x = Math.sin(t * 2.1 + Math.PI) * 0.07;
  });

  const longSleeve = avatar.top != null && (avatar.top.id === "longsleeve" || avatar.top.id === "native");
  const skirt = avatar.bottom?.id === "skirt" && female;
  const shorts = avatar.bottom?.id === "shorts";

  return (
    <group ref={root} scale={s}>
      {/* legs */}
      {skirt ? (
        <>
          <mesh position={[0, 0.62, 0]} material={mat(pants)}>
            <cylinderGeometry args={[0.17, 0.27, 0.52, 14]} />
          </mesh>
          {[-1, 1].map((side) => (
            <mesh key={side} position={[side * 0.1, 0.28, 0]} material={mat(skin)}>
              <capsuleGeometry args={[0.07, 0.3, 4, 10]} />
            </mesh>
          ))}
        </>
      ) : shorts ? (
        <>
          {[-1, 1].map((side) => (
            <group key={side}>
              <mesh position={[side * 0.105, 0.66, 0]} material={mat(pants)}>
                <capsuleGeometry args={[0.085, 0.22, 4, 10]} />
              </mesh>
              <mesh position={[side * 0.105, 0.3, 0]} material={mat(skin)}>
                <capsuleGeometry args={[0.068, 0.26, 4, 10]} />
              </mesh>
            </group>
          ))}
        </>
      ) : (
        [-1, 1].map((side) => (
          <mesh key={side} position={[side * 0.105, 0.44, 0]} material={mat(pants)}>
            <capsuleGeometry args={[0.085, 0.6, 4, 10]} />
          </mesh>
        ))
      )}
      {/* shoes */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.105, 0.045, 0.045]} material={mat(shoeC, 0.6)}>
          <boxGeometry args={[0.11, 0.09, 0.26]} />
        </mesh>
      ))}
      {/* torso */}
      <mesh position={[0, 1.04, 0]} material={mat(shirt)}>
        <capsuleGeometry args={[female ? 0.155 : 0.17, 0.5, 6, 14]} />
      </mesh>
      {(avatar.top?.id === "polo" || avatar.top?.id === "shirt" || avatar.top?.id === "native") && (
        <mesh position={[0, 1.32, 0]} material={mat(shirt)}>
          <torusGeometry args={[0.075, 0.02, 8, 18]} />
        </mesh>
      )}
      {avatar.top?.id === "shirt" &&
        [0, 1, 2].map((i) => (
          <mesh key={i} position={[0, 1.2 - i * 0.09, 0.165]} material={mat("#e8e2d6", 0.5)}>
            <sphereGeometry args={[0.013, 8, 8]} />
          </mesh>
        ))}
      {/* arms */}
      {[-1, 1].map((side) => (
        <group key={side} ref={side < 0 ? armL : armR} position={[side * shoulderW, 1.28, 0]}>
          {longSleeve ? (
            <mesh position={[0, -0.3, 0]} material={mat(shirt)}>
              <capsuleGeometry args={[0.055, 0.52, 4, 10]} />
            </mesh>
          ) : (
            <>
              <mesh position={[0, -0.09, 0]} material={mat(shirt)}>
                <capsuleGeometry args={[0.062, 0.12, 4, 10]} />
              </mesh>
              <mesh position={[0, -0.36, 0]} material={mat(skin)}>
                <capsuleGeometry args={[0.05, 0.34, 4, 10]} />
              </mesh>
            </>
          )}
          <mesh position={[0, -0.62, 0]} material={mat(skin)}>
            <sphereGeometry args={[0.055, 10, 10]} />
          </mesh>
        </group>
      ))}
      {/* head */}
      <mesh position={[0, 1.56, 0]} material={mat(skin)}>
        <sphereGeometry args={[0.14, 20, 18]} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.052, 1.57, 0.125]} material={mat("#1a1512", 0.4)}>
          <sphereGeometry args={[0.017, 8, 8]} />
        </mesh>
      ))}
      {/* hair — small Lagos wardrobe of cuts */}
      {avatar.headwear.id === "none" && (
        <group>
          {(avatar.hair.cut === "lowcut" || avatar.hair.cut === "classic") && (
            <mesh position={[0, 1.6, -0.015]} material={mat(hairC)}>
              <sphereGeometry args={[0.148, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
            </mesh>
          )}
          {avatar.hair.cut === "afro" && (
            <mesh position={[0, 1.64, -0.02]} material={mat(hairC)}>
              <sphereGeometry args={[0.19, 12, 10]} />
            </mesh>
          )}
          {avatar.hair.cut === "medium" && (
            <>
              <mesh position={[0, 1.6, -0.015]} material={mat(hairC)}>
                <sphereGeometry args={[0.148, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
              </mesh>
              <mesh position={[0, 1.44, -0.12]} material={mat(hairC)}>
                <boxGeometry args={[0.2, 0.2, 0.1]} />
              </mesh>
            </>
          )}
          {avatar.hair.cut === "long" && (
            <>
              <mesh position={[0, 1.6, -0.015]} material={mat(hairC)}>
                <sphereGeometry args={[0.148, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
              </mesh>
              <mesh position={[0, 1.36, -0.12]} material={mat(hairC)}>
                <boxGeometry args={[0.2, 0.36, 0.1]} />
              </mesh>
            </>
          )}
          {avatar.hair.cut === "braids" && (
            <group>
              <mesh position={[0, 1.62, -0.02]} material={mat(hairC)}>
                <sphereGeometry args={[0.15, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
              </mesh>
              {[35, 75, 115, 155, 195, 235, 275, 315].map((deg) => {
                const a = (deg * Math.PI) / 180;
                return (
                  <mesh
                    key={deg}
                    position={[Math.cos(a) * 0.13, 1.44, -0.02 + Math.sin(a) * 0.13 - 0.02]}
                    material={mat(hairC)}
                  >
                    <boxGeometry args={[0.035, 0.3, 0.035]} />
                  </mesh>
                );
              })}
            </group>
          )}
          {avatar.hair.cut === "locs" && (
            <group>
              <mesh position={[0, 1.62, -0.02]} material={mat(hairC)}>
                <sphereGeometry args={[0.15, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
              </mesh>
              {[60, 100, 140, 200, 250, 300].map((deg) => {
                const a = (deg * Math.PI) / 180;
                return (
                  <mesh
                    key={deg}
                    position={[Math.cos(a) * 0.12, 1.4, -0.02 + Math.sin(a) * 0.12 - 0.02]}
                    material={mat(hairC)}
                  >
                    <cylinderGeometry args={[0.024, 0.02, 0.36, 7]} />
                  </mesh>
                );
              })}
            </group>
          )}
          {avatar.hair.cut === "bun" && (
            <group>
              <mesh position={[0, 1.6, -0.015]} material={mat(hairC)}>
                <sphereGeometry args={[0.148, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
              </mesh>
              <mesh position={[0, 1.79, -0.05]} material={mat(hairC)}>
                <sphereGeometry args={[0.085, 12, 10]} />
              </mesh>
            </group>
          )}
          {avatar.hair.cut === "ponytail" && (
            <group>
              <mesh position={[0, 1.6, -0.015]} material={mat(hairC)}>
                <sphereGeometry args={[0.148, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
              </mesh>
              <mesh position={[0, 1.5, -0.2]} material={mat(hairC)}>
                <boxGeometry args={[0.09, 0.3, 0.09]} />
              </mesh>
              <mesh position={[0, 1.64, -0.15]} material={mat(hairC)}>
                <torusGeometry args={[0.045, 0.014, 8, 16]} />
              </mesh>
            </group>
          )}
          {avatar.hair.cut === "gele" && (
            <group>
              <mesh position={[0, 1.65, 0]} rotation={[Math.PI / 2.25, 0, 0]} material={mat(hairC)}>
                <torusGeometry args={[0.13, 0.055, 10, 22]} />
              </mesh>
              <mesh position={[0, 1.74, -0.02]} material={mat(hairC)}>
                <sphereGeometry args={[0.12, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
              </mesh>
              <mesh position={[0.14, 1.68, -0.04]} material={mat(hairC)}>
                <sphereGeometry args={[0.05, 10, 10]} />
              </mesh>
            </group>
          )}
        </group>
      )}
      {/* headwear */}
      {avatar.headwear.id === "cap" && (
        <group>
          <mesh position={[0, 1.63, 0]} material={mat(avatar.headwear.color)}>
            <sphereGeometry args={[0.15, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          </mesh>
          <mesh position={[0, 1.6, 0.2]} rotation={[-0.08, 0, 0]} material={mat(avatar.headwear.color)}>
            <cylinderGeometry args={[0.09, 0.1, 0.015, 18, 1, false, -Math.PI / 2, Math.PI]} />
          </mesh>
        </group>
      )}
      {avatar.headwear.id === "wrap" && (
        <group>
          <mesh position={[0, 1.63, 0]} rotation={[Math.PI / 2.3, 0, 0]} material={mat(avatar.headwear.color)}>
            <torusGeometry args={[0.125, 0.05, 10, 22]} />
          </mesh>
          <mesh position={[0.13, 1.66, -0.05]} material={mat(avatar.headwear.color)}>
            <sphereGeometry args={[0.045, 10, 10]} />
          </mesh>
        </group>
      )}
      {/* accessories */}
      {avatar.accessory === "glasses" && (
        <group>
          {[-1, 1].map((side) => (
            <mesh key={side} position={[side * 0.055, 1.57, 0.135]} material={mat("#191512", 0.5)}>
              <torusGeometry args={[0.032, 0.007, 8, 20]} />
            </mesh>
          ))}
        </group>
      )}
      {avatar.accessory === "watch" && (
        <mesh position={[-shoulderW, 0.82, 0.02]} material={mat("#26221e", 0.6)}>
          <torusGeometry args={[0.045, 0.016, 8, 18]} />
        </mesh>
      )}
      {avatar.accessory === "backpack" && (
        <group>
          <mesh position={[0, 1.05, -0.26]} material={mat("#274b73")}>
            <boxGeometry args={[0.3, 0.38, 0.17]} />
          </mesh>
          <mesh position={[0, 0.92, -0.36]} material={mat("#1d3a5c")}>
            <boxGeometry args={[0.2, 0.16, 0.04]} />
          </mesh>
        </group>
      )}
      {avatar.accessory === "handbag" && (
        <group>
          <mesh position={[shoulderW + 0.02, 0.62, 0.03]} material={mat("#5a3a24")}>
            <boxGeometry args={[0.16, 0.2, 0.09]} />
          </mesh>
          <mesh position={[shoulderW + 0.02, 0.76, 0.03]} material={mat("#5a3a24")}>
            <torusGeometry args={[0.055, 0.011, 8, 18, Math.PI]} />
          </mesh>
        </group>
      )}
    </group>
  );
}
