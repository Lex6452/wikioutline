import { Search } from "js-search";
import { last } from "lodash";
import { observer } from "mobx-react";
import { useMemo, useState } from "react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList as List } from "react-window";
import styled from "styled-components";
import { DocumentPath } from "~/stores/CollectionsStore";
import Document from "~/models/Document";
import Flex from "~/components/Flex";
import { Outline } from "~/components/Input";
import Labeled from "~/components/Labeled";
import PathToDocument from "~/components/PathToDocument";
import useStores from "~/hooks/useStores";
import useToasts from "~/hooks/useToasts";

type Props = {
  document: Document;
  onRequestClose: () => void;
};

function DocumentMove({ document, onRequestClose }: Props) {
  const [searchTerm, setSearchTerm] = useState();
  const { collections, documents } = useStores();
  const { showToast } = useToasts();
  const { t } = useTranslation();

  const searchIndex = useMemo(() => {
    const paths = collections.pathsToDocuments;
    const index = new Search("id");
    index.addIndex("title");
    // Build index
    // @ts-expect-error ts-migrate(7034) FIXME: Variable 'indexeableDocuments' implicitly has type... Remove this comment to see the full error message
    const indexeableDocuments = [];
    paths.forEach((path) => {
      const doc = documents.get(path.id);

      if (!doc || !doc.isTemplate) {
        indexeableDocuments.push(path);
      }
    });
    // @ts-expect-error ts-migrate(7005) FIXME: Variable 'indexeableDocuments' implicitly has an '... Remove this comment to see the full error message
    index.addDocuments(indexeableDocuments);
    return index;
  }, [documents, collections.pathsToDocuments]);

  const results: DocumentPath[] = useMemo(() => {
    const onlyShowCollections = document.isTemplate;
    let results = [];

    if (collections.isLoaded) {
      if (searchTerm) {
        results = searchIndex.search(searchTerm);
      } else {
        // @ts-expect-error it's there, but it's not typed
        results = searchIndex._documents;
      }
    }

    if (onlyShowCollections) {
      // @ts-expect-error ts-migrate(7006) FIXME: Parameter 'result' implicitly has an 'any' type.
      results = results.filter((result) => result.type === "collection");
    } else {
      // Exclude root from search results if document is already at the root
      if (!document.parentDocumentId) {
        results = results.filter(
          // @ts-expect-error ts-migrate(7006) FIXME: Parameter 'result' implicitly has an 'any' type.
          (result) => result.id !== document.collectionId
        );
      }

      // Exclude document if on the path to result, or the same result
      results = results.filter(
        // @ts-expect-error ts-migrate(7006) FIXME: Parameter 'result' implicitly has an 'any' type.
        (result) =>
          // @ts-expect-error ts-migrate(7006) FIXME: Parameter 'doc' implicitly has an 'any' type.
          !result.path.map((doc) => doc.id).includes(document.id) &&
          // @ts-expect-error ts-migrate(7006) FIXME: Parameter 'doc' implicitly has an 'any' type.
          last(result.path.map((doc) => doc.id)) !== document.parentDocumentId
      );
    }

    return results;
  }, [document, collections, searchTerm, searchIndex]);

  const handleSuccess = () => {
    showToast(t("Document moved"), {
      type: "info",
    });
    onRequestClose();
  };

  const handleFilter = (ev: React.SyntheticEvent<any>) => {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'value' does not exist on type 'EventTarg... Remove this comment to see the full error message
    setSearchTerm(ev.target.value);
  };

  // @ts-expect-error ts-migrate(7030) FIXME: Not all code paths return a value.
  const renderPathToCurrentDocument = () => {
    const result = collections.getPathForDocument(document.id);

    if (result) {
      return (
        <PathToDocument
          result={result}
          collection={collections.get(result.collectionId)}
        />
      );
    }
  };

  // @ts-expect-error ts-migrate(7031) FIXME: Binding element 'index' implicitly has an 'any' ty... Remove this comment to see the full error message
  const row = ({ index, data, style }) => {
    const result = data[index];
    return (
      <PathToDocument
        result={result}
        document={document}
        collection={collections.get(result.collectionId)}
        onSuccess={handleSuccess}
        style={style}
      />
    );
  };

  const data = results;

  if (!document || !collections.isLoaded) {
    return null;
  }

  return (
    <Flex column>
      <Section>
        <Labeled label={t("Current location")}>
          {renderPathToCurrentDocument()}
        </Labeled>
      </Section>

      <Section column>
        <Labeled label={t("Choose a new location")} />
        <NewLocation>
          <InputWrapper>
            <Input
              type="search"
              placeholder={`${t("Search collections & documents")}…`}
              onChange={handleFilter}
              required
              autoFocus
            />
          </InputWrapper>
          <Results>
            <AutoSizer>
              {({ width, height }: { width: number; height: number }) => (
                <Flex role="listbox" column>
                  <List
                    key={data.length}
                    width={width}
                    height={height}
                    itemData={data}
                    itemCount={data.length}
                    itemSize={40}
                    itemKey={(index, data) => data[index].id}
                  >
                    {row}
                  </List>
                </Flex>
              )}
            </AutoSizer>
          </Results>
        </NewLocation>
      </Section>
    </Flex>
  );
}

const InputWrapper = styled("div")`
  padding: 8px;
  width: 100%;
`;

const Input = styled("input")`
  width: 100%;
  outline: none;
  background: none;
  border-radius: 4px;
  height: 30px;
  border: 0;
  color: ${(props) => props.theme.text};

  &::placeholder {
    color: ${(props) => props.theme.placeholder};
  }
`;

const NewLocation = styled(Outline)`
  display: block;
  flex: initial;
  height: 40vh;
`;

const Results = styled.div`
  padding: 8px 0;
  height: calc(100% - 46px);
`;

const Section = styled(Flex)`
  margin-bottom: 24px;
`;

export default observer(DocumentMove);
