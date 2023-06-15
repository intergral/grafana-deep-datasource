/*
 * Copyright (C) 2023  Intergral GmbH
 *
 *     This program is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU Affero General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     This program is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU Affero General Public License for more details.
 *
 *     You should have received a copy of the GNU Affero General Public License
 *     along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

export function serializeParams(data: Record<string, any>): string {
  return Object.keys(data)
    .map((key) => {
      const value = data[key];
      if (Array.isArray(value)) {
        return value.map((arrayValue) => `${encodeURIComponent(key)}=${encodeURIComponent(arrayValue)}`).join('&');
      }
      return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    })
    .join('&');
}

export function isValidTracepointID(id: string): boolean {
    if (!id || id.trim() === '' || id.length != 36) {
        return false
    }
    const hexOnlyRegex = /^[0-9A-Fa-f]{8}-([0-9A-Fa-f]{4}-){3}[0-9A-Fa-f]{12}$/;
    return !!id.trim().match(hexOnlyRegex);
}
